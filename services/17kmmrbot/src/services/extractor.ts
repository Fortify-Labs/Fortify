import {
	FortifyPlayerState,
	FortifyPlayer,
	FortifyGameMode,
} from "@shared/state";

import { injectable, inject } from "inversify";

import { PostgresConnector } from "@shared/connectors/postgres";
import { RedisConnector } from "@shared/connectors/redis";

import { rankToMMRMapping, adjustedBigBossRanks } from "@shared/ranks";

import { ULLeaderboard } from "../definitions/leaderboard";

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
			where: { twitch_name: channelName },
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
		if ((player.rank_tier ?? 0) < 80) {
			const minorRank = (player.rank_tier ?? 0) % 10;
			const majorRank = ((player.rank_tier ?? 0) - minorRank) / 10;

			// Return the current players rank tier as negative rank
			return {
				mmr: rankToMMRMapping[majorRank][minorRank],
				name: player.name,
				rank: -(player.rank_tier ?? 0),
			};
		}

		// TODO: Return fortify player name --> Fetch postgres by player id
		// Only return player names that exist, otherwise throw an exception

		// TODO: Create CRON Job (potentially in python) that fetches the leaderboard rest api periodically
		// --> TODO: Save the results in a table in Postgres

		// TODO: Return the current rank of said player

		// TODO: Fetch postgres by player id --> return current MMR

		const userEntry = leaderboard?.leaderboard.find(
			(entry) => entry.rank === player.global_leaderboard_rank,
		);

		// If no rank & mmr is found, just default it to 15k and rank 0
		return {
			mmr: userEntry?.level_score ?? 15000,
			name: player.name,
			rank: player.global_leaderboard_rank ?? 0,
		};
	}

	async getGameMode(
		fsp: FortifyPlayerState,
	): Promise<string | undefined | null> {
		return FortifyGameMode[fsp.lobby.mode];
	}

	getAverageMMR(fsp: FortifyPlayerState, leaderboard: ULLeaderboard | null) {
		// Fetch all lord players' mmrs by leaderboard rank

		const players = Object.values(fsp.lobby.players);
		const ranks = players
			.map((player) => player.global_leaderboard_rank)
			.filter((rank) => rank)
			.sort();

		// When refactoring to cron job: Only fetch player in lobby from db
		const leaderboardEntries = leaderboard?.leaderboard.filter((entry) =>
			ranks.includes(entry.rank),
		);

		const mmrs =
			leaderboardEntries?.map((entry) => entry.level_score) ?? [];

		for (const { rank_tier, global_leaderboard_rank } of players) {
			if (rank_tier) {
				const minorRank = rank_tier % 10;
				const majorRank = (rank_tier - minorRank) / 10;

				let interpolatedMMR = 0;

				// If we find a lord without a leaderboard rank, assume 15k mmr
				// For all players below lord, interpolate the mmr
				if (
					majorRank === 8 &&
					(global_leaderboard_rank === null ||
						global_leaderboard_rank === undefined)
				) {
					interpolatedMMR = 15000;
				}

				if (majorRank === 7) {
					interpolatedMMR = adjustedBigBossRanks[minorRank];
				}

				if (majorRank < 7) {
					interpolatedMMR =
						rankToMMRMapping[majorRank.toString()][
							minorRank.toString()
						];
				}

				if (interpolatedMMR > 0) {
					mmrs.push(interpolatedMMR);
				}
			}
		}

		const sum = mmrs?.reduce((aggregator, mmr) => aggregator + mmr, 0);
		const avg = (sum ?? 1) / (mmrs?.length ?? 1);

		return !isNaN(avg) ? avg.toFixed(0) : 0;
	}
}
