import debug = require("debug");

import { injectable, inject } from "inversify";
import { TwitchCommand } from "../definitions/twitchCommand";
import { PostgresConnector } from "@shared/connectors/postgres";

import { Client } from "tmi.js";

import { ExtractorService } from "../services/extractor";

import { FortifyGameMode } from "@shared/state";
import { LeaderboardService } from "../services/leaderboard";
import { ULLeaderboard, LeaderboardType } from "../definitions/leaderboard";

import { majorRankNameMapping } from "@shared/ranks";

@injectable()
export class NotablePlayersCommand implements TwitchCommand {
	constructor(
		@inject(PostgresConnector) private db: PostgresConnector,
		@inject(ExtractorService) private extractorService: ExtractorService,
		@inject(LeaderboardService)
		private leaderboardService: LeaderboardService,
	) {}

	invocations = ["!np", "!lobby"];

	handler = async (client: Client, channel: string) => {
		try {
			const user = await this.extractorService.getUser(channel);

			// Fetch fortify player state by steamid
			const fps = await this.extractorService.getPlayerState(
				user.steamid,
			);

			if (!fps) {
				return client.say(
					channel,
					"No player state found for " + user.name,
				);
			}

			// TODO: Refactor the following to be more efficient when querying data from postgres

			const gameMode = await this.extractorService.getGameMode(fps);

			if (
				!gameMode ||
				gameMode === FortifyGameMode[FortifyGameMode.Invalid]
			) {
				return client.say(channel, "No game mode detected");
			}

			// TODO: Refactor this to not re-fetch the leaderboard every time
			// TODO: Create CRON job fetching the leaderboard
			// TODO: Insert this into the postgres
			// TODO: Fetch the corresponding entries by username instead of fetching the leaderboard and then filter (Update: I don't even know what I mean with this)

			let leaderboard: ULLeaderboard | null = null;

			if (gameMode === FortifyGameMode[FortifyGameMode.Normal]) {
				leaderboard = await this.leaderboardService.fetchLeaderboard(
					LeaderboardType.Standard,
				);
			} else if (gameMode === FortifyGameMode[FortifyGameMode.Turbo]) {
				leaderboard = await this.leaderboardService.fetchLeaderboard(
					LeaderboardType.Turbo,
				);
			} else if (gameMode === FortifyGameMode[FortifyGameMode.Duos]) {
				leaderboard = await this.leaderboardService.fetchLeaderboard(
					LeaderboardType.Duos,
				);
			}

			// Get current user to calculate average based on the user (or spectator)
			const lobbyUser = fps.lobby.players[user.steamid];

			if (Object.keys(fps.lobby.players).length !== 8) {
				return client.say(
					channel,
					"Collecting game data, please try again in a little bit",
				);
			}

			const averageMMR = this.extractorService.getAverageMMR(
				fps,
				leaderboard,
				lobbyUser,
			);

			let response = `${gameMode} [${averageMMR} avg MMR]: `;

			// Get players and sort them by mmr rank
			const playerPromises = Object.values(
				fps.lobby.players,
			).map((player) =>
				this.extractorService.getPlayer(player, leaderboard),
			);

			const players = (await Promise.all(playerPromises)).sort((a, b) =>
				a.mmr > b.mmr ? -1 : b.mmr > a.mmr ? 1 : 0,
			);

			for (const { name, rank, mmr } of players) {
				try {
					// Ranks equals and greater than zero will always be lord rankings
					if (rank >= 0 && mmr > 0) {
						response += `${name} [#${rank}, MMR: ${mmr}], `;
					}

					// If the rank is negative, that means that we're dealing with a rank_tier instead of actual rank
					else if (rank <= 0) {
						const minorRank = (-rank ?? 0) % 10;
						const majorRank = ((-rank ?? 0) - minorRank) / 10;

						const rankName =
							majorRankNameMapping[majorRank] +
							" " +
							(minorRank + 1);

						response += `${name} [${rankName}, MMR: ${mmr}], `;
					}
				} catch (e) {
					continue;
				}
			}
			response = response.slice(0, -2);

			client.say(channel, response);
		} catch (e) {
			client.say(channel, "Something went wrong");
			debug("app::notablePlayers")(e);
		}

		return;
	};
}
