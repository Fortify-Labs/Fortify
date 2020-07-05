import {
	FortifyPlayerState,
	FortifyPlayer,
	FortifyGameMode,
} from "@shared/state";

import { injectable, inject } from "inversify";

import { PostgresConnector } from "@shared/connectors/postgres";
import { RedisConnector } from "@shared/connectors/redis";

import { rankToMMRMapping } from "@shared/ranks";

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
			const fsp: FortifyPlayerState = JSON.parse(player_state);
			return fsp;
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

			return {
				mmr: rankToMMRMapping[majorRank][minorRank],
				name: player.name,
				rank: 0,
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

		return {
			mmr: userEntry?.level_score ?? -1,
			name: player.name,
			rank: player.global_leaderboard_rank ?? -1,
		};
	}

	async getGameMode(fsp: FortifyPlayerState): Promise<string> {
		return FortifyGameMode[fsp.mode];
	}

	getAverageMMR(fsp: FortifyPlayerState, leaderboard: ULLeaderboard | null) {
		// Fetch all lord players' mmrs by leaderboard rank

		const players = Object.values(fsp.lobby.players);
		const ranks = players
			.map((player) => player.global_leaderboard_rank)
			.sort();

		// When refactoring to cron job: Only fetch player in lobby from db
		const leaderboardEntries = leaderboard?.leaderboard.filter((entry) =>
			ranks.includes(entry.rank),
		);

		const mmrs =
			leaderboardEntries?.map((entry) => entry.level_score) ?? [];

		// Interpolate mmr for non lord players
		const rankTiers = players.map((player) => player.rank_tier).sort();

		for (const rankTier of rankTiers) {
			if (rankTier) {
				const minorRank = rankTier % 10;
				const majorRank = (rankTier - minorRank) / 10;

				// I do not want to interpolate lords
				// Thus everything below lord gets interpolated
				if (majorRank < 8) {
					const interpolatedMMR =
						rankToMMRMapping[majorRank.toString()][
							minorRank.toString()
						];

					mmrs.push(interpolatedMMR);
				}
			}
		}

		const sum = mmrs?.reduce((aggregator, mmr) => aggregator + mmr, 0);
		const avg = (sum ?? 1) / (mmrs?.length ?? 1);

		return avg.toFixed(0);
	}
}
