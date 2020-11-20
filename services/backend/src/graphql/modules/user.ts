import { injectable, inject } from "inversify";

import { GQLModule } from "definitions/module";
import { gql, ApolloError } from "apollo-server-express";
import { Resolvers, MmrHistory } from "definitions/graphql/types";
import { PostgresConnector } from "@shared/connectors/postgres";
import { InfluxDBConnector } from "@shared/connectors/influxdb";
import { PermissionScope } from "@shared/definitions/context";

import {
	fluxDuration,
	flux,
	fluxDateTime,
	FluxParameterLike,
} from "@influxdata/influxdb-client";
import { EventService } from "@shared/services/eventService";
import { TwitchUnlinkedEvent } from "@shared/events/systemEvents";

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
		@inject(InfluxDBConnector) private influx: InfluxDBConnector,
		@inject(EventService) private eventService: EventService,
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
			): [MatchSlot]
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
		const { postgres, influx, eventService } = this;

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

					const limit =
						(args.limit ?? 0) <= 50 ? args.limit ?? 25 : 50;
					const offset = args.offset ?? 0;

					const matchSlotRepo = await postgres.getMatchSlotRepo();
					const slots = await matchSlotRepo.find({
						where: { user: { steamid: parent.steamid } },
						take: limit,
						skip: offset,
						order: {
							updated: "DESC",
						},
						relations: ["match"],
					});

					return slots.map(({ match, slot, finalPlace }) => ({
						matchSlotID: match.id + "#" + slot,
						slot,
						finalPlace,
						user: parent,
					}));
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

					// Write influxdb queries to fetch data points
					const queryApi = await influx.queryApi();

					let start: FluxParameterLike | undefined = undefined;
					let stop: FluxParameterLike | undefined = undefined;

					if (args.duration) {
						start = fluxDuration(
							`-${args.duration <= 60 ? args.duration : 30}d`,
						);
						stop = fluxDateTime(new Date().toISOString());
					}

					if (args.startDate && args.endDate) {
						const startDate = args.startDate
							? new Date(args.startDate)
							: (() => {
									const date = new Date();
									date.setHours(date.getHours() - 24);
									return date;
							  })();

						const endDate = args.endDate
							? new Date(args.endDate)
							: new Date();

						start = fluxDateTime(startDate.toISOString());
						stop = fluxDateTime(endDate.toISOString());
					}

					// stub these in as default values
					if (!start || !stop) {
						start = fluxDuration("-30d");
						stop = fluxDateTime(new Date().toISOString());
					}

					const fluxQuery = flux`
						from(bucket: "mmr")
						|> range(start: ${start}, stop: ${stop})
						|> filter(fn: (r) => r["_measurement"] == "mmr")
						|> filter(fn: (r) => r["_field"] == "mmr" or r["_field"] == "rank")
						|> filter(fn: (r) => r["steamid"] == ${steamid})
						|> filter(fn: (r) => r["type"] == ${args.mode.toLowerCase()})
						|> yield(name: "history")
					`;

					const rawRows = (await queryApi.collectRows(
						fluxQuery,
					)) as InfluxMMRQueryRow[];

					const mmrs = rawRows.filter((row) => row._field === "mmr");
					const ranks = rawRows.filter(
						(row) => row._field === "rank",
					);

					const history: MmrHistory[] = [];

					// Merge both data points based on _time
					// this is not optimized at all and will probably be very expensive to run
					for (const mmr of mmrs) {
						history.push({
							date: mmr._time,
							mmr: parseInt(mmr._value),
							rank: parseInt(
								ranks.find((rank) => rank._time === mmr._time)
									?._value ?? "0",
							),
						});
					}

					return history;
				},
			},
		};
	}
}
