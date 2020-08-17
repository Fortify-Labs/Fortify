import { injectable, inject } from "inversify";
import { RedisConnector } from "../connectors/redis";
import { LeaderboardType, ULLeaderboard } from "../definitions/leaderboard";

@injectable()
export class LeaderboardService {
	constructor(@inject(RedisConnector) private redis: RedisConnector) {}

	async fetchLeaderboard(
		type = LeaderboardType.Standard,
	): Promise<ULLeaderboard | null> {
		const rawLeaderboard = await this.redis.getAsync(
			`ul:leaderboard:${type}`,
		);

		if (rawLeaderboard) {
			return JSON.parse(rawLeaderboard);
		} else {
			return null;
		}
	}
}
