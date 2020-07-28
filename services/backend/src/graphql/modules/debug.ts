import { injectable, inject } from "inversify";

import { gql } from "apollo-server-express";
import { sign } from "jsonwebtoken";

import { GQLModule } from "definitions/module";
import { Resolvers } from "definitions/graphql/types";

import { Producer } from "kafkajs";
import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";

import { User } from "@shared/db/entities/user";

import { Context, PermissionScope } from "@shared/auth";

import {
	TwitchLinkedEvent,
	TwitchUnlinkedEvent,
} from "@shared/events/systemEvents";

const { JWT_SECRET = "" } = process.env;

// This module will only be used for debugging purposes and will be removed in the future
@injectable()
export class DebugModule implements GQLModule {
	producer: Producer;

	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(KafkaConnector) private kafka: KafkaConnector,
	) {
		this.producer = kafka.producer();
	}

	typeDef = gql`
		extend type Query {
			"Returns the current jwt"
			token: String!
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
		const self = this;

		return {
			Query: {
				token(_parent, _args, context) {
					return JSON.stringify(context.user ?? {});
				},
			},
			Mutation: {
				async addUser(parent, { user }) {
					const { name, steamid, twitchName } = user;

					// Store user to db
					const dbUser = new User();
					dbUser.steamid = steamid;
					dbUser.name = name;
					dbUser.twitch_name =
						twitchName.substr(0, 1) === "#"
							? twitchName
							: "#" + twitchName;

					const userRepo = await self.postgres.getUserRepo();
					await userRepo.save(dbUser);

					// Send twitch linked event
					const event = new TwitchLinkedEvent(
						steamid,
						dbUser.twitch_name,
					);

					await self.producer.send({
						topic: event._topic,
						messages: [{ value: event.serialize() }],
					});

					// Generate JWT for GSI file
					const gsiToken: Context = {
						user: {
							id: steamid,
						},
						scopes: [PermissionScope.GsiIngress],
					};

					return sign(gsiToken, JWT_SECRET);
				},
				async removeUser(parent, { steamid }) {
					// Find user in database
					const repo = await self.postgres.getUserRepo();
					const dbUser = await repo.findOne({ where: { steamid } });

					// Leave twitch channel
					if (dbUser && dbUser.twitch_name) {
						const event = new TwitchUnlinkedEvent(
							steamid,
							dbUser.twitch_name,
						);

						await self.producer.send({
							topic: event._topic,
							messages: [{ value: event.serialize() }],
						});
					}

					// Delete user from database
					await repo.delete({ steamid });

					return true;
				},
			},
		};
	}
}
