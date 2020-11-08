import { injectable, inject } from "inversify";

import { GQLModule } from "definitions/module";
import { gql, ApolloError } from "apollo-server-express";
import { Resolvers, Lobby } from "definitions/graphql/types";
import { RedisConnector } from "@shared/connectors/redis";
import { FortifyPlayerState } from "@shared/state";
import { PostgresConnector } from "@shared/connectors/postgres";
import { GQLPubSub } from "../pubsub";

@injectable()
export class LobbyModule implements GQLModule {
	constructor(
		@inject(RedisConnector) private redis: RedisConnector,
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(GQLPubSub) private pubSub: GQLPubSub,
	) {}

	typeDef = gql`
		extend type Query {
			lobby(id: ID): Lobby
		}

		extend type Subscription {
			lobby(id: ID): Lobby
		}

		type Lobby {
			id: ID!

			spectatorId: ID

			averageMMR: Int
			duration: String

			slots: [LobbySlot]
			"Stringified pool snapshot"
			pool: String
		}

		type LobbySlot {
			lobbySlotId: ID!

			slot: Int

			# "Not yet implemented"
			# vsCount: Int

			user: UserProfile
		}
	`;

	resolver(): Resolvers {
		const { postgres, redis } = this;
		const { pubSub } = this.pubSub;

		return {
			Query: {
				async lobby(parent, args, context) {
					let id = context.user?.id;

					if (args.id) {
						id = args.id;
					}

					if (!id) {
						throw new ApolloError(
							"No Lobby ID passed",
							"QUERY_LOBBY_ID",
						);
					}

					const rawFPS = await redis.getAsync(`ps:${id}`);
					if (!rawFPS) {
						throw new ApolloError(
							`Could not find player state for ${id}`,
							"QUERY_LOBBY_FPS_NOT_FOUND",
						);
					}

					const fps: FortifyPlayerState = JSON.parse(rawFPS);

					if (!fps.lobby.id) {
						throw new ApolloError(
							"No lobby found yet",
							"QUERY_LOBBY_ID",
						);
					}

					const now = new Date();
					const utc = new Date(
						now.getTime() + now.getTimezoneOffset() * 60000,
					);

					const duration =
						(fps.lobby.ended ?? utc.getTime()) - fps.lobby.created;

					return {
						id: fps.lobby.id,
						averageMMR: fps.lobby.averageMMR,
						duration: `${new Date(duration)
							.toISOString()
							.substr(11, 8)} min`,
						spectatorId: id,
					};
				},
			},
			Subscription: {
				lobby: {
					subscribe(_, args, context) {
						let id = context.user?.id;

						if (args.id) {
							id = args.id;
						}

						if (!id) {
							throw new ApolloError(
								"No Lobby ID passed",
								"SUBSCRIPTION_LOBBY_ID",
							);
						}

						return pubSub.asyncIterator(`ps:${id}`);
					},
					async resolve(
						payload?: FortifyPlayerState,
					): Promise<Lobby | null> {
						if (!payload?.lobby.id) {
							return null;
						}

						const now = new Date();
						const utc = new Date(
							now.getTime() + now.getTimezoneOffset() * 60000,
						);

						const duration =
							(payload.lobby.ended ?? utc.getTime()) -
							payload.lobby.created;

						return {
							id: payload.lobby.id,
							averageMMR: payload.lobby.averageMMR,
							duration: `${new Date(duration)
								.toISOString()
								.substr(11, 8)} min`,
							pool: JSON.stringify(payload.lobby.pool),
						};
					},
				},
			},
			Lobby: {
				async slots({ id }) {
					const matchRepo = await postgres.getMatchRepo();
					const match = await matchRepo.findOneOrFail(id, {
						relations: ["slots", "slots.user"],
					});

					return match.slots.map(({ slot, user }) => ({
						lobbySlotId: id + "#" + slot,
						slot,
						user,
					}));
				},
				async pool(parent, _args, context) {
					if (parent.pool) return parent.pool;

					let userID: string | undefined | null = context.user?.id;

					// Duct tape solution to get the pool from a player state
					if (parent.spectatorId) {
						userID = parent.spectatorId;
					}

					if (!userID) {
						throw new ApolloError(
							"No Spectator ID detected",
							"LOBBY_SLOTS_ID",
						);
					}

					const rawFPS = await redis.getAsync(`ps:${userID}`);

					const fps: FortifyPlayerState = rawFPS
						? JSON.parse(rawFPS)
						: new FortifyPlayerState(userID);

					return JSON.stringify(fps.lobby.pool);
				},
			},
			LobbySlot: {
				async user(parent) {
					if (parent.user) return parent.user;

					// resolve LobbySlot user

					const [id, slot] = parent.lobbySlotId.split("#");

					const slotRepo = await postgres.getMatchSlotRepo();
					const lobbySlot = await slotRepo.findOneOrFail({
						where: {
							match: { id },
							slot,
						},
						relations: ["user"],
					});

					return lobbySlot.user ?? null;
				},
			},
		};
	}
}
