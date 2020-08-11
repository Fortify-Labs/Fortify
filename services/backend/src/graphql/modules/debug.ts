import { injectable, inject } from "inversify";

import { gql } from "apollo-server-express";

import { GQLModule } from "definitions/module";
import { Resolvers } from "definitions/graphql/types";

import { PostgresConnector } from "@shared/connectors/postgres";
import { EventService } from "@shared/services/eventService";

import { User } from "@shared/db/entities/user";

import { Context, PermissionScope, generateJWT } from "@shared/auth";

import {
	TwitchLinkedEvent,
	TwitchUnlinkedEvent,
} from "@shared/events/systemEvents";

// This module will only be used for debugging purposes and will be removed in the future
@injectable()
export class DebugModule implements GQLModule {
	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(EventService) private eventService: EventService,
	) {}

	typeDef = gql`
		extend type Query {
			"Returns the current context"
			context: String!
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
	`;

	resolver(): Resolvers {
		const { postgres, eventService } = this;

		return {
			Query: {
				context(_parent, _args, context) {
					return JSON.stringify(context ?? {});
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

					return generateJWT(gsiToken);
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
		};
	}
}
