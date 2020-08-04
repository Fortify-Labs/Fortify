import { injectable, inject } from "inversify";

import { GQLModule } from "definitions/module";
import { Resolvers } from "definitions/graphql/types";

import { gql } from "apollo-server-express";

import { RedisConnector } from "@shared/connectors/redis";
import { FortifyPlayerState } from "@shared/state";
import { PermissionScope } from "@shared/auth";

@injectable()
export class PoolModule implements GQLModule {
	constructor(@inject(RedisConnector) private redis: RedisConnector) {}

	typeDef = gql`
		extend type Query {
			"Returns a JSON string containing the current pool counts"
			pool(
				# Only works for admins
				userID: ID
			): String @auth(requires: USER)
		}
	`;

	resolver(): Resolvers {
		const self = this;

		const resolvers: Resolvers = {
			Query: {
				async pool(_parent, args, context) {
					let userID = context.user.id;

					// View the pool of other players as admin user
					if (
						context.scopes.includes(PermissionScope.Admin) &&
						args.userID
					) {
						userID = args.userID;
					}

					const rawFPS = await self.redis.getAsync(`ps_${userID}`);

					const fps: FortifyPlayerState = rawFPS
						? JSON.parse(rawFPS)
						: new FortifyPlayerState(userID);

					return JSON.stringify(fps.lobby.pool);
				},
			},
		};

		return resolvers;
	}
}
