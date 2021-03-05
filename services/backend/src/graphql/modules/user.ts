import { injectable, inject } from "inversify";

import { GQLModule } from "../../definitions/module";
import { gql, ApolloError } from "apollo-server-express";
import {
	Resolvers,
	MmrHistory,
	GameMode,
} from "../../definitions/graphql/types";
import { PostgresConnector } from "@shared/connectors/postgres";
import { PermissionScope } from "@shared/definitions/context";
import { EventService } from "@shared/services/eventService";
import { TwitchUnlinkedEvent } from "@shared/events/systemEvents";
import { Logger } from "@shared/logger";
import {
	LeaderboardType,
	leaderboardTypeToNumber,
} from "@shared/definitions/leaderboard";

export interface InfluxMMRQueryRow {
	result: string;
	table: string;
	_start: Date;
	_stop: Date;
	_time: Date;
	_value: string;
	_field: string;
	_measurement: string;
	service: string;
	steamid: string;
	type: string;
}

@injectable()
export class UserModule implements GQLModule {
	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(EventService) private eventService: EventService,
		@inject(Logger) private logger: Logger,
	) {}

	typeDef = gql`
		extend type Query {
			profile(steamid: ID): UserProfile
		}

		extend type Mutation {
			updateProfile(profile: ProfileInput!): UserProfile
				@auth(requires: USER)
		}

		type UserProfile {
			steamid: ID!
			name: String
			profilePicture: String

			publicProfile: Boolean

			twitchName: String
			discordName: String

			standardRating: MMRRating
			turboRating: MMRRating
			duosRating: MMRRating

			matches(
				"""
				Max limit is 50
				"""
				limit: Int
				offset: Int
			): MatchHistory
			mmrHistory(
				startDate: Date
				endDate: Date
				"""
				Duration in days
				"""
				duration: Int
				mode: GameMode = STANDARD
			): [MMRHistory]
		}

		type MatchHistory {
			total: Int
			limit: Int
			offset: Int

			slots: [MatchSlot]
		}

		type MMRRating {
			mmr: Int
			rank: Int
			rankTier: Int
		}

		type MMRHistory {
			date: Date
			mmr: Int
			rank: Int
		}

		input ProfileInput {
			steamid: ID
			public: Boolean

			unlinkTwitch: Boolean
		}
	`;

	resolver(): Resolvers {
		const { postgres, eventService } = this;

		return {
			Query: {
				async profile(_parent, { steamid }, context) {
					let userID = context.user?.id;

					if (steamid) {
						userID = steamid;
					}

					const userRepo = await postgres.getUserRepo();
					const user = await userRepo.findOneOrFail(userID);

					return user;
				},
			},
			Mutation: {
				async updateProfile(parent, { profile }, context) {
					let userID = context.user.id;

					if (
						profile.steamid !== context.user.id &&
						!context.scopes.includes(PermissionScope.Admin)
					) {
						throw new ApolloError(
							"Unauthorized to perform actions for other users",
							"MUTATION_UPDATE_PROFILE",
						);
					}

					if (profile.steamid) {
						userID = profile.steamid;
					}

					const userRepo = await postgres.getUserRepo();
					const user = await userRepo.findOneOrFail(userID);

					if (
						profile.public !== null &&
						profile.public !== undefined
					) {
						user.publicProfile = profile.public;
					}

					if (profile.unlinkTwitch && user.twitchName) {
						const unlinkEvent = new TwitchUnlinkedEvent(
							userID,
							user.twitchName,
						);
						await eventService.sendEvent(unlinkEvent);

						user.twitchId = null;
						user.twitchName = null;
						user.twitchRaw = null;
					}

					await userRepo.save(user);

					return user;
				},
			},
			UserProfile: {
				async matches(parent, args, context) {
					const allowed =
						parent.publicProfile ||
						context.scopes?.includes(PermissionScope.Admin) ||
						parent.steamid === context.user?.id;

					if (!allowed) {
						throw new ApolloError(
							"Unauthorized to view private player profile",
							"QUERY_PROFILE_NOT_ALLOWED",
						);
					}

					// If limit is below 51, use the supplied limit otherwise use a limit of 50
					const limit =
						(args.limit ?? 0) <= 50 ? args.limit ?? 25 : 50;
					const offset = args.offset ?? 0;

					const matchSlotRepo = await postgres.getMatchSlotRepo();
					const [slots, count] = await matchSlotRepo.findAndCount({
						where: { user: { steamid: parent.steamid } },
						take: limit,
						skip: offset,
						order: {
							updated: "DESC",
						},
						relations: ["match"],
					});

					return {
						total: count,
						limit,
						offset,
						slots: slots.map(
							({
								match,
								slot,
								finalPlace,
								created,
								updated,
							}) => ({
								matchSlotID: match.id + "#" + slot,
								slot,
								finalPlace,
								user: parent,
								created,
								updated,
							}),
						),
					};
				},
				async mmrHistory({ steamid, publicProfile }, args, context) {
					const allowed =
						publicProfile ||
						context.scopes?.includes(PermissionScope.Admin) ||
						steamid === context.user?.id;

					if (!allowed) {
						throw new ApolloError(
							"Unauthorized to view private player profile",
							"QUERY_PROFILE_NOT_ALLOWED",
						);
					}

					const gameMode = args.mode ?? GameMode.Invalid;
					let leaderboardType = LeaderboardType.Standard;

					if (gameMode === GameMode.Turbo) {
						leaderboardType = LeaderboardType.Turbo;
					} else if (gameMode === GameMode.Duos) {
						leaderboardType = LeaderboardType.Duos;
					}

					const mmrStatsRepo = postgres.getMmrStatsRepo();

					const query = mmrStatsRepo
						.createQueryBuilder()
						.select(["mmr", "rank", "time AS date"])
						.where(
							"time BETWEEN NOW() - interval '30 days' AND NOW()",
						)
						.orderBy("time");

					if (args.startDate && args.endDate) {
						query.where("time BETWEEN :start AND :end", {
							start: new Date(args.startDate).toISOString(),
							end: new Date(args.endDate).toISOString(),
						});
					}

					if (args.duration && args.duration > 0) {
						query.where(
							`time BETWEEN NOW() - interval '${escape(
								args.duration.toFixed(0),
							)} days' AND NOW()`,
						);
					}

					query
						.andWhere('"userSteamid" = :steamid', { steamid })
						.andWhere("type = :type", {
							type: leaderboardTypeToNumber(leaderboardType),
						});

					return query.getRawMany<MmrHistory>();
				},
			},
		};
	}
}
