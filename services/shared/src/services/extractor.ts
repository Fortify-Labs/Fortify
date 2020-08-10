import { FortifyPlayerState, FortifyPlayer, FortifyGameMode } from "../state";

import { injectable, inject } from "inversify";

import { PostgresConnector } from "../connectors/postgres";
import { RedisConnector } from "../connectors/redis";

import { rankToMMRMapping, adjustedBigBossRanks } from "../ranks";

import { ULLeaderboard } from "../definitions/leaderboard";
import { Player } from "../definitions/player";

@injectable()
export class ExtractorService {
	constructor(
		@inject(PostgresConnector) private db: PostgresConnector,
		@inject(RedisConnector) private redis: RedisConnector,
	) {}

	async getUser(channelName: string) {
		// Fetch steam id mapped to twitch channel name from postgres

		const userRepo = await this.db.getUserRepo();

		const user = await userRepo.findOneOrFail({
			where: { twitchName: channelName },
		});

		return user;
	}

	async getPlayerState(steamid: string): Promise<FortifyPlayerState | null> {
		const player_state = await this.redis.getAsync("ps_" + steamid);

		if (player_state) {
			const fps: FortifyPlayerState = JSON.parse(player_state);
			return fps;
		} else {
			return null;
		}
	}

	async getPlayer(
		player: FortifyPlayer,
		leaderboard: ULLeaderboard | null,
	): Promise<Player> {
		// Interpolate the players mmr if not lord
		if ((player.rankTier ?? 0) < 80) {
			const minorRank = (player.rankTier ?? 0) % 10;
			const majorRank = ((player.rankTier ?? 0) - minorRank) / 10;

			// Return the current players rank tier as negative rank
			return {
				mmr: rankToMMRMapping[majorRank][minorRank],
				name: player.name,
				rank: -(player.rankTier ?? 0),
			};
		}

		const userEntry = leaderboard?.leaderboard.find(
			(entry) => entry.rank === player.globalLeaderboardRank,
		);

		// If no rank & mmr is found, just default it to 15k and rank 0
		return {
			mmr: userEntry?.level_score ?? 15000,
			name: player.name,
			rank: player.globalLeaderboardRank ?? 0,
		};
	}

	async getGameMode(
		fsp: FortifyPlayerState,
	): Promise<string | undefined | null> {
		return FortifyGameMode[fsp.lobby.mode];
	}

	getAverageMMR(
		lobbyPlayers: Record<string, FortifyPlayer>,
		leaderboard: ULLeaderboard | null,
		user: FortifyPlayer | null,
	) {
		// Fetch all lord players' mmrs by leaderboard rank

		const players = Object.values(lobbyPlayers);
		const ranks = players
			.map((player) => player.globalLeaderboardRank)
			.filter((rank) => rank)
			.sort();

		// When refactoring to cron job: Only fetch player in lobby from db
		const leaderboardEntries = leaderboard?.leaderboard.filter((entry) =>
			ranks.includes(entry.rank),
		);

		const mmrs =
			leaderboardEntries?.map((entry) => entry.level_score) ?? [];

		// Check if there are any lords in the lobby in case the user is a spectator
		const lordLobby: boolean = players
			.map((player) => player.rankTier)
			.reduce<boolean>((acc, rankTier) => acc || rankTier === 80, false);

		for (const { rankTier, globalLeaderboardRank } of players) {
			if (rankTier) {
				const minorRank = rankTier % 10;
				const majorRank = (rankTier - minorRank) / 10;

				let interpolatedMMR = 0;

				// If they are a lord, scale MMR as necessary to get the average
				// If the user is not a lord, calculate the average normally
				if (
					(user?.rankTier ?? 0) >= 80 ||
					((user?.rankTier === null ||
						user?.rankTier === undefined) &&
						lordLobby)
				) {
					// If we find a lord without a leaderboard rank, ignore them in the average
					// For all Big Boss players, interpolate the mmr
					// All ranks below big boss are not considered for the average since they do not affect elo
					if (majorRank === 7) {
						interpolatedMMR = adjustedBigBossRanks[minorRank];
					}
				} else {
					// Inactive lords are taken as 15k lords since we're looking for a normal average
					if (
						majorRank === 8 &&
						(globalLeaderboardRank === null ||
							globalLeaderboardRank === undefined)
					) {
						interpolatedMMR = 15000;
					}

					if (majorRank < 8) {
						interpolatedMMR =
							rankToMMRMapping[majorRank.toString()][
								minorRank.toString()
							];
					}
				}

				if (interpolatedMMR > 0) {
					mmrs.push(interpolatedMMR);
				}
			}
		}

		const sum = mmrs?.reduce((aggregator, mmr) => aggregator + mmr, 0);
		const avg = (sum ?? 1) / (mmrs?.length ?? 1);

		return !isNaN(avg) ? avg.toFixed(0) : "0";
	}
}
