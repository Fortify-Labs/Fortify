import { injectable, inject } from "inversify";

import {
	LeaderboardType,
	ULLeaderboard,
} from "@shared/definitions/leaderboard";

import { RedisConnector } from "@shared/connectors/redis";

@injectable()
export class LeaderboardService {
	constructor(@inject(RedisConnector) private redis: RedisConnector) {}

	async fetchLeaderboard(
		type = LeaderboardType.Standard,
	): Promise<ULLeaderboard | null> {
		const rawLeaderboard = await this.redis.getAsync(
			`ul_leaderboard_${type}`,
		);

		if (rawLeaderboard) {
			return JSON.parse(rawLeaderboard);
		} else {
			return null;
		}
	}
}
