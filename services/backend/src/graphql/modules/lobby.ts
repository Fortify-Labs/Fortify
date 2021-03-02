import { injectable, inject } from "inversify";

import { GQLModule } from "definitions/module";
import { gql, ApolloError } from "apollo-server-express";
import { Resolvers, Lobby } from "definitions/graphql/types";
import { RedisConnector } from "@shared/connectors/redis";
import { MatchState, UserCacheKey } from "@shared/state";
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
			lobby(id: ID): Lobby @deprecated(reason: "Use match query instead")
		}

		extend type Subscription {
			lobby(id: ID): Lobby
				@deprecated(reason: "Use match subscription instead")
		}

		type Lobby {
			id: ID!

			spectatorId: ID

			averageMMR: Int
			duration: String

			slots: [LobbySlot]
			"Stringified JSON pool snapshot"
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
							"No User ID passed",
							"QUERY_LOBBY_ID",
							{
								context,
								args,
							},
						);
					}

					const matchID = await redis.getAsync(
						`user:${id}:${UserCacheKey.matchID}`,
					);

					if (!matchID) {
						throw new ApolloError(
							"No match ID has been determined yet",
							"QUERY_LOBBY_MATCH_ID",
							{
								context,
								args,
							},
						);
					}

					const rawMatch = await redis.getAsync(`match:${matchID}`);
					if (!rawMatch) {
						throw new ApolloError(
							`Could not find match for id ${id}`,
							"QUERY_LOBBY_MATCH_NOT_FOUND",
						);
					}

					const matchState: MatchState = JSON.parse(rawMatch);

					if (!matchState.id) {
						throw new ApolloError(
							"No lobby found yet",
							"QUERY_LOBBY_FPS_LOBBY_ID",
						);
					}

					const utc = new Date();
					// const now = new Date();
					// const utc = new Date(
					// 	now.getTime() + now.getTimezoneOffset() * 60000,
					// );

					const duration =
						(matchState.ended ?? utc.getTime()) -
						matchState.created;

					return {
						id: matchState.id,
						averageMMR: matchState.averageMMR,
						duration: `${new Date(duration)
							.toISOString()
							.substr(11, 8)} min`,
						spectatorId: id,
					};
				},
			},
			Subscription: {
				lobby: {
					async subscribe(_, args, context) {
						let id = context.user?.id;

						if (args && args.id) {
							id = args.id;
						}

						if (!id) {
							throw new ApolloError(
								"No User ID passed",
								"SUBSCRIPTION_LOBBY_ID",
							);
						}

						const matchID = await redis.getAsync(
							`user:${id}:${UserCacheKey.matchID}`,
						);

						if (!matchID) {
							throw new ApolloError(
								`No match id found for user ${id}`,
								"LOBBY_POOL_MATCH_ID",
							);
						}

						return pubSub.asyncIterator(`match:${matchID}`);
					},
					async resolve(payload?: MatchState): Promise<Lobby | null> {
						if (!payload?.id) {
							return null;
						}

						const utc = new Date();
						// const now = new Date();
						// const utc = new Date(
						// 	now.getTime() + now.getTimezoneOffset() * 60000,
						// );

						const duration =
							(payload.ended ?? utc.getTime()) - payload.created;

						return {
							id: payload.id,
							averageMMR: payload.averageMMR,
							duration: `${new Date(duration)
								.toISOString()
								.substr(11, 8)} min`,
							pool: JSON.stringify(payload.pool),
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

					const matchID = await redis.getAsync(
						`user:${userID}:${UserCacheKey.matchID}`,
					);

					if (!matchID) {
						throw new ApolloError(
							`No match id found for user ${userID}`,
							"LOBBY_POOL_MATCH_ID",
						);
					}

					const rawMatch = await redis.getAsync(`match:${matchID}`);

					if (!rawMatch) {
						throw new ApolloError(
							`No lobby found for ${matchID}`,
							"LOBBY_POOL_RAW_MATCH",
						);
					}

					const fps: MatchState = JSON.parse(rawMatch);

					return JSON.stringify(fps.pool);
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
