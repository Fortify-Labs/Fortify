import { injectable, inject } from "inversify";

import { MatchState, UserCache, UserCacheKey } from "@shared/state";
import { RedisConnector } from "@shared/connectors/redis";
import { captureException } from "@sentry/node";
import { Logging } from "@shared/logging";
import winston from "winston";

@injectable()
export class StateService {
	logger: winston.Logger;

	constructor(
		@inject(RedisConnector) private redis: RedisConnector,
		@inject(Logging) private logging: Logging,
	) {
		this.logger = logging.createLogger();
	}

	async getUserMatchID(steamid: string): Promise<string | null | undefined> {
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

	async getUserCache(steamid: string): Promise<UserCache> {
		const cache = await this.redis.client.get(
			`user:${steamid}:${UserCacheKey.cache}`,
		);

		if (cache) {
			return JSON.parse(cache);
		} else {
			return {
				id: steamid,
				players: {},
			};
		}
	}
	async setUserCache(steamid: string, cache: UserCache) {
		const stringifiedCache = JSON.stringify(cache);
		const userCache = await this.redis.client.set(
			`user:${steamid}:${UserCacheKey.cache}`,
			stringifiedCache,
		);
		await this.redis.client.expire(
			`user:${steamid}:${UserCacheKey.cache}`,
			// 2 hours
			2 * 60 * 60,
		);
		await this.redis.client.publish(
			`user:${steamid}:${UserCacheKey.cache}`,
			stringifiedCache,
		);

		return userCache;
	}

	async getMatch(matchID: string): Promise<MatchState | null> {
		const rawMatch = await this.redis.client.get(`match:${matchID}`);

		if (rawMatch) {
			try {
				const matchState = JSON.parse(rawMatch);

				return matchState;
			} catch (e) {
				const exceptionID = captureException(e);
				this.logger.error(
					"An exception occurred while getting a match",
					{
						e,
						exceptionID,
					},
				);
				this.logger.error(e, { exceptionID });
			}
		}

		return null;
	}

	async storeMatch(matchID: string, match: MatchState) {
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
