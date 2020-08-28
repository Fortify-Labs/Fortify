import { createHash } from "crypto";
import { injectable, inject } from "inversify";
import { PostgresConnector } from "../connectors/postgres";
import { Match } from "../db/entities/match";
import { MatchSlot } from "../db/entities/matchSlot";
import { ExtractorService } from "./extractor";
import { FortifyPlayer, FortifyGameMode } from "../state";
import { LeaderboardService } from "./leaderboard";
import { LeaderboardType } from "../definitions/leaderboard";
import { currentSeason } from "../units";
import { User } from "../db/entities/user";
import { GetPlayerSummaries } from "../definitions/playerSummaries";
import fetch from "node-fetch";
import debug from "debug";
import { convert32to64SteamId } from "../steamid";
import {
	MatchStartedEvent,
	MatchFinalPlaceEvent,
	MatchEndedEvent,
} from "../events/gameEvents";

const { STEAM_WEB_API_KEY } = process.env;

export interface MatchServicePlayer {
	accountID: string;
	slot: number;

	name: string;

	finalPlace: number;

	rankTier?: number;
	globalLeaderboardRank?: number;
}

export const matchIDGenerator = (
	players: readonly MatchServicePlayer[],
	nonce = 0,
) => {
	const sortedPlayers = [...players].sort((a, b) => a.slot - b.slot);

	const lobbyString =
		sortedPlayers.map((player) => player.accountID).join("") + nonce;

	return createHash("sha256").update(lobbyString).digest("base64");
};

@injectable()
export class MatchService {
	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(ExtractorService) private extractorService: ExtractorService,
		@inject(LeaderboardService)
		private leaderboardService: LeaderboardService,
	) {}

	async generateMatchID(players: MatchServicePlayer[]) {
		const matchRepo = await this.postgres.getMatchRepo();

		// If a player has no finalPlace, set it to zero
		for (const player of players) {
			if (!player.finalPlace) {
				player.finalPlace = 0;
			}
		}

		let matchID = "";
		let match: Match | undefined = undefined;
		let nonce = -1;

		let foundMatchID = false;

		do {
			// Check if matchID already is in DB
			nonce += 1;
			// Generate ID based on steamid and slot
			matchID = matchIDGenerator(players, nonce);
			match = await matchRepo.findOne(matchID, {
				relations: ["slots", "slots.user"],
			});

			if (match) {
				// If such an ID already exists, check wether it's potentially the same match or another match

				// It's the same match if:
				// - finalPlaces are the same / update missing finalPlaces

				// Iterate on finalPlaces of passed players and compare with matchSlots of player / user
				// If the finalPlace is not the same for a user (in case of an already set finalPlace), the entire players array check can be discarded and we are dealing with a new match
				const finalPlacesUpdatable = players.reduce(
					(acc, { accountID, slot, finalPlace }) => {
						// If at one point we realize that one slot is not updatable, skip checking the rest of the lobby
						if (!acc) return false;

						const matchSlot = match?.slots.find(
							(matchSlot) =>
								matchSlot.slot === slot &&
								matchSlot.user?.steamid === accountID,
						);

						// No match slot could be found for said user
						if (!matchSlot) return false;

						const matchSlotUpdatable =
							// If the finalPlace in the match slot is unset and the finalPlace of said user transmitted
							(matchSlot.finalPlace === 0 && finalPlace >= 0) ||
							// If we already have a finalPlace stored, then the passed finalPlace has to be the same
							(matchSlot.finalPlace > 0 &&
								matchSlot.finalPlace === finalPlace);

						return acc && matchSlotUpdatable;
					},
					true,
				);

				// It's the same match if:
				// - if it's withing the same hour as match start or the hour before match start
				//   - here we are assuming that match times are at max an hour.
				// 	 --> Should this ever change in the future, then this match id generation mechanic is broken
				// Check wether the match start time is equal to the current full hour or last full hour
				const currentDate = new Date().getHours();
				const currentHours = [
					currentDate,
					currentDate === 0 ? 23 : currentDate - 1,
				];

				const matchStartHour = match.created.getHours();
				// Create a time window of full hours +/-1 match start hour
				const startHours = [
					matchStartHour === 23 ? 0 : matchStartHour + 1,
					matchStartHour,
					matchStartHour === 0 ? 23 : matchStartHour - 1,
				];

				const insideMatchStartTimeWindow = currentHours.reduce(
					(acc, currentHour) =>
						acc || startHours.includes(currentHour),
					false,
				);

				// If it's a different game, increase the nonce by one and repeat the steps from above until either the correct match id has been found
				foundMatchID =
					finalPlacesUpdatable && insideMatchStartTimeWindow;
			} else {
				// If no match was found, we have a fresh match id
				foundMatchID = true;
			}
		} while (!foundMatchID);

		// Old method of generating the match id
		// do {
		// 	// Check if matchID already is in DB
		// 	// if found in DB, loop until an unused matchID has been generated
		// 	// this assures us to always get a clean and unused technical match id
		// 	nonce += 1;
		// 	matchID = matchIDGenerator(players, nonce);
		// 	match = await matchRepo.findOne(matchID);
		// } while (match);

		return matchID;
	}

	async storeMatchStart({
		matchID,
		players,
		gameMode,
		timestamp,
	}: MatchStartedEvent) {
		const matchRepo = await this.postgres.getMatchRepo();
		// const matchSlotsRepo = await this.postgres.getMatchSlotRepo();
		const userRepo = await this.postgres.getUserRepo();

		// Once an unused matchID exists, store all player info (displayName (?), steamid)
		const match = new Match();
		match.id = matchID;
		match.slots = [];
		match.gameMode = gameMode;
		match.season = currentSeason;
		match.created = timestamp;
		match.updated = timestamp;

		const playerRecord = players.reduce<Record<string, FortifyPlayer>>(
			(acc, player) => {
				// we can set the name to an empty string here
				// as the player's name is not needed for mmr average calculations
				acc[player.accountID] = { ...player, name: "" };

				return acc;
			},
			{},
		);

		if (
			gameMode === FortifyGameMode.Normal ||
			gameMode === FortifyGameMode.Turbo ||
			gameMode === FortifyGameMode.Duos
		) {
			const leaderboard = await this.leaderboardService.fetchLeaderboard(
				gameMode === FortifyGameMode.Normal
					? LeaderboardType.Standard
					: gameMode === FortifyGameMode.Turbo
					? LeaderboardType.Turbo
					: LeaderboardType.Duos,
			);
			match.averageMMR = parseInt(
				await this.extractorService.getAverageMMR(
					playerRecord,
					leaderboard,
					null,
				),
			);
		}

		// For each player in the lobby
		for (const { accountID, slot, finalPlace, name } of players) {
			const matchSlot = new MatchSlot();

			// Link their slot to a match
			matchSlot.match = match;
			// Save their slot
			matchSlot.slot = slot;
			// Save their finalPlace
			matchSlot.finalPlace = finalPlace;

			matchSlot.created = timestamp;
			matchSlot.updated = timestamp;

			const user = await this.getOrCreateUser(accountID, timestamp, name);

			matchSlot.user = user;
			match.slots.push(matchSlot);
		}

		await matchRepo.save(match);
	}

	private async getOrCreateUser(
		accountID: string,
		timestamp: Date,
		name: string,
	) {
		const userRepo = await this.postgres.getUserRepo();
		let user = await userRepo.findOne(accountID);
		if (!user) {
			user = new User();
			user.steamid = accountID;

			user.created = timestamp;
		}
		user.name = name;
		user.updated = timestamp;

		try {
			// TODO: Refactor this to be one request getting all 8 images instead of 8 requests getting one image
			// Fetch image from steam web api
			const playerSummaries = await fetch(
				`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_WEB_API_KEY}&steamids=${convert32to64SteamId(
					accountID,
				)}`,
			).then((res) => res.json() as Promise<GetPlayerSummaries>);
			if (playerSummaries.response.players.length > 0) {
				const player = playerSummaries.response.players[0];
				user.profilePicture = player.avatarfull;
			}
		} catch (e) {
			debug("app::services::match")(e);
		}

		return userRepo.save(user);
	}

	async storeFinalPlace({
		matchID,
		steamID,
		finalPlace,
		timestamp,
	}: MatchFinalPlaceEvent) {
		const matchRepo = await this.postgres.getMatchRepo();
		const userRepo = await this.postgres.getUserRepo();

		let match = await matchRepo.findOne(matchID, {
			relations: ["slots", "slots.user"],
		});

		if (match) {
			match.slots = match.slots.reduce<MatchSlot[]>((acc, slot) => {
				if (slot.user?.steamid === steamID) {
					slot.finalPlace = finalPlace;
					slot.updated = timestamp;
				}

				acc.push(slot);

				return acc;
			}, []);
		} else {
			match = new Match();

			match.id = matchID;
			match.created = timestamp;

			const user = await this.getOrCreateUser(steamID, timestamp, "");

			const matchSlot = new MatchSlot();
			matchSlot.created = timestamp;
			matchSlot.updated = timestamp;
			matchSlot.finalPlace = finalPlace;
			matchSlot.user = user;
			matchSlot.match = match;
			// As the slot is a 4 bytes integer in the db, we're going to create a random number in said range
			// This will hopefully save us from clashing compound primary key collisions
			matchSlot.slot = Math.floor(
				(Math.random() >= 0.5 ? 1 : -1) * Math.random() * 2147483647,
			);

			match.slots = [matchSlot];
		}

		match.updated = timestamp;

		return matchRepo.save(match);
	}

	async storeMatchEnd({ matchID, timestamp }: MatchEndedEvent) {
		const matchRepo = await this.postgres.getMatchRepo();

		let match = await matchRepo.findOne(matchID, {
			relations: ["slots", "slots.user"],
		});

		if (match) {
			match.slots = match.slots.reduce<MatchSlot[]>((acc, slot) => {
				if (!slot.finalPlace) {
					slot.finalPlace = 1;
					slot.updated = timestamp;
				}

				acc.push(slot);

				return acc;
			}, []);
		} else {
			match = new Match();
			match.id = matchID;
			match.slots = [];
		}

		match.updated = timestamp;
		match.ended = timestamp;

		return matchRepo.save(match);
	}
}
