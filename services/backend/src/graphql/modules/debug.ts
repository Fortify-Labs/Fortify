import { injectable, inject } from "inversify";

import { gql } from "apollo-server-express";

import { GQLModule } from "definitions/module";
import { Resolvers } from "definitions/graphql/types";

import { PostgresConnector } from "@shared/connectors/postgres";
import { EventService } from "@shared/services/eventService";

import { User } from "@shared/db/entities/user";

import { Context, PermissionScope, AuthService } from "@shared/services/auth";

import {
	TwitchLinkedEvent,
	TwitchUnlinkedEvent,
} from "@shared/events/systemEvents";
import { RedisConnector } from "@shared/connectors/redis";

// This module will only be used for debugging purposes and will be removed in the future
@injectable()
export class DebugModule implements GQLModule {
	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(EventService) private eventService: EventService,
		@inject(RedisConnector) private redis: RedisConnector,
		@inject(AuthService) private auth: AuthService,
	) {}

	typeDef = gql`
		extend type Query {
			"Returns the current context"
			context: String!

			"Returns wether the current bearer token is valid or not"
			authenticated: AuthenticatedObject!

			status: SystemStatus
		}

		extend type Mutation {
			addUser(user: UserInput!): String! @auth(requires: ADMIN)
			removeUser(steamid: String!): Boolean! @auth(requires: ADMIN)
		}

		input UserInput {
			steamid: String!
			name: String!
			twitchName: String!
		}

		type AuthenticatedObject {
			authenticated: Boolean!
			user: UserProfile @auth(requires: USER)
		}

		type SystemStatus {
			loginDisabled: Boolean
			signupDisabled: Boolean
		}
	`;

	resolver(): Resolvers {
		const { postgres, eventService, redis, auth } = this;

		return {
			Query: {
				context(_parent, _args, context) {
					return JSON.stringify(context ?? {});
				},
				authenticated(parent, args, context) {
					return {
						authenticated: context && !!context.user,
					};
				},
				status() {
					return {};
				},
			},
			Mutation: {
				async addUser(parent, { user }) {
					const { name, steamid, twitchName } = user;

					// Store user to db
					const dbUser = new User();
					dbUser.steamid = steamid;
					dbUser.name = name;
					dbUser.twitchName =
						twitchName.substr(0, 1) === "#"
							? twitchName
							: "#" + twitchName;

					const userRepo = await postgres.getUserRepo();
					await userRepo.save(dbUser);

					// Send twitch linked event
					const event = new TwitchLinkedEvent(
						steamid,
						dbUser.twitchName,
					);

					await eventService.sendEvent(event);

					// Generate JWT for GSI file
					const gsiToken: Context = {
						user: {
							id: steamid,
						},
						scopes: [PermissionScope.GsiIngress],
					};

					return auth.generateJWT(gsiToken);
				},
				async removeUser(parent, { steamid }) {
					// Find user in database
					const repo = await postgres.getUserRepo();
					const dbUser = await repo.findOne({ where: { steamid } });

					// Leave twitch channel
					if (dbUser && dbUser.twitchName) {
						const event = new TwitchUnlinkedEvent(
							steamid,
							dbUser.twitchName,
						);

						await eventService.sendEvent(event);
					}

					// Delete user from database
					await repo.delete({ steamid });

					return true;
				},
			},
			AuthenticatedObject: {
				async user(parent, args, context) {
					const userRepo = await postgres.getUserRepo();
					return userRepo.findOneOrFail(context.user.id);
				},
			},
			SystemStatus: {
				async loginDisabled() {
					return (
						(await redis.getAsync("backend:loginDisabled")) ===
						"true"
					);
				},
				async signupDisabled() {
					return (
						(await redis.getAsync("backend:signupDisabled")) ===
						"true"
					);
				},
			},
		};
	}
}
