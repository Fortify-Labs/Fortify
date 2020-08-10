import { injectable, inject } from "inversify";

import { RedisPubSub } from "graphql-redis-subscriptions";
import { RedisConnector } from "@shared/connectors/redis";

@injectable()
export class GQLPubSub {
	pubSub: RedisPubSub;

	constructor(@inject(RedisConnector) public redis: RedisConnector) {
		this.pubSub = new RedisPubSub({
			publisher: redis.createClient(),
			subscriber: redis.createClient(),
		});
	}
}
