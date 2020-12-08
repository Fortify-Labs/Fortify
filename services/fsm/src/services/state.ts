import { injectable, inject } from "inversify";

import { MatchState, UserCacheKey } from "@shared/state";
import { RedisConnector } from "@shared/connectors/redis";
import { captureException } from "@sentry/node";

@injectable()
export class StateService {
	constructor(@inject(RedisConnector) private redis: RedisConnector) {}

	async getUserMatchID(steamid: string): Promise<string | null> {
		return this.redis.client.get(`user:${steamid}:${UserCacheKey.matchID}`);
	}
	async setUserMatchID(
		steamid: string,
		matchID: string,
	): Promise<string | null> {
		const userMatchID = await this.redis.client.set(
			`user:${steamid}:${UserCacheKey.matchID}`,
			matchID,
		);
		await this.redis.client.expire(
			`user:${steamid}:${UserCacheKey.matchID}`,
			// 2 hours
			2 * 60 * 60,
		);
		await this.redis.client.publish(
			`user:${steamid}:${UserCacheKey.matchID}`,
			matchID,
		);

		return userMatchID;
	}

	async getUserMatchCache(steamid: string) {
		// TODO: implement getUserMatchCache
	}

	async getMatch(matchID: string): Promise<MatchState | null> {
		const rawMatch = await this.redis.client.get(`match:${matchID}`);

		if (rawMatch) {
			try {
				const matchState = JSON.parse(matchID);

				return matchState;
			} catch (e) {
				captureException(e);
			}
		}

		return null;
	}

	async setMatch(matchID: string, match: MatchState) {
		const matchRes = await this.redis.client.set(
			`match:${matchID}`,
			JSON.stringify(match),
		);

		await this.redis.client.expire(
			`match:${matchID}`,
			// 2 hours
			2 * 60 * 60,
		);

		await this.redis.client.publish(
			`match:${matchID}`,
			JSON.stringify(match),
		);

		return matchRes;
	}

	async resetUserCaches(steamid: string): Promise<boolean> {
		for (const key of Object.values(UserCacheKey)) {
			await this.resetUserCache(steamid, key);
		}

		return true;
	}

	async resetUserCache(steamid: string, key: UserCacheKey) {
		await this.redis.client.del(`user:${steamid}:${key}`);
	}
}
