import { injectable, inject } from "inversify";

import { GQLModule } from "definitions/module";
import { Resolvers } from "definitions/graphql/types";

import { gql } from "apollo-server-express";

import { RedisConnector } from "@shared/connectors/redis";
import { FortifyPlayerState } from "@shared/state";

@injectable()
export class PoolModule implements GQLModule {
	constructor(@inject(RedisConnector) private redis: RedisConnector) {}

	typeDef = gql`
		extend type Query {
			"Returns a JSON string containing the current pool counts"
			pool: String @auth(requires: USER)
		}
	`;

	resolver(): Resolvers {
		const self = this;

		return {
			Query: {
				async pool(_parent, _args, context) {
					const userID = context.user.id;

					const rawFPS = await self.redis.getAsync(`ps_${userID}`);

					const fps: FortifyPlayerState = JSON.parse(rawFPS ?? "{}");

					return JSON.stringify(fps.lobby.pool);
				},
			},
		};
	}
}
