import { injectable, inject } from "inversify";

import { GQLModule } from "definitions/module";
import { gql } from "apollo-server-express";
import { Resolvers, MmrHistory } from "definitions/graphql/types";
import { PostgresConnector } from "@shared/connectors/postgres";
import { InfluxDBConnector } from "@shared/connectors/influxdb";
import { PermissionScope } from "@shared/auth";
import { majorRankNameMapping } from "@shared/ranks";

import {
	fluxDuration,
	flux,
	fluxDateTime,
	FluxParameterLike,
} from "@influxdata/influxdb-client";

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
	) {}

	typeDef = gql`
		extend type Query {
			profile(steamid: ID): UserProfile @auth(requires: USER)
		}

		type UserProfile {
			steamid: ID!
			name: String
			profilePicture: String

			mmr: Int
			leaderboardRank: Int
			rank: String

			twitchName: String
			discordName: String

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
			): [MMRHistory]
		}

		type MMRHistory {
			date: Date
			mmr: Int
			rank: Int
		}
	`;

	resolver(): Resolvers {
		const { postgres, influx } = this;

		return {
			Query: {
				async profile(_parent, { steamid }, context) {
					let userID = context.user.id;

					if (
						context.scopes.includes(PermissionScope.Admin) &&
						steamid
					) {
						userID = steamid;
					}

					const userRepo = await postgres.getUserRepo();
					return userRepo.findOneOrFail(userID);
				},
			},
			UserProfile: {
				async mmr({ steamid }) {
					// fetch latest mmr point from influxdb

					const queryApi = influx.queryApi();
					const start = fluxDuration("-30d");
					const field = "mmr";
					const fluxQuery = flux`
						from(bucket: "mmr")
						|> range(start: ${start})
						|> filter(fn: (r) => r["_measurement"] == "mmr")
						|> filter(fn: (r) => r["_field"] == ${field})
						|> filter(fn: (r) => r["steamid"] == ${steamid})
						|> filter(fn: (r) => r["type"] == "standard")
						|> last()
						|> yield(name: "last")
					`;

					const rows = await queryApi.collectRows(fluxQuery);

					const lastRow = rows[0] as InfluxMMRQueryRow;

					if (lastRow._value !== null) {
						return parseInt(lastRow._value);
					}

					return 0;
				},
				async leaderboardRank({ steamid }) {
					// fetch latest rank point from influxdb

					const queryApi = influx.queryApi();
					const start = fluxDuration("-30d");
					const field = "rank";
					const fluxQuery = flux`
						from(bucket: "mmr")
						|> range(start: ${start})
						|> filter(fn: (r) => r["_measurement"] == "mmr")
						|> filter(fn: (r) => r["_field"] == ${field})
						|> filter(fn: (r) => r["steamid"] == ${steamid})
						|> filter(fn: (r) => r["type"] == "standard")
						|> last()
						|> yield(name: "last")
					`;

					const rows = await queryApi.collectRows(fluxQuery);

					const lastRow = rows[0] as InfluxMMRQueryRow;

					if (lastRow._value !== null) {
						return parseInt(lastRow._value);
					}

					return 0;
				},
				async rank({ steamid }) {
					// fetch major and minor rank from postgres

					const userRepo = await postgres.getUserRepo();
					const user = await userRepo.findOneOrFail(steamid);

					const minorRank = (user.rankTier ?? 0) % 10;
					const majorRank = ((user.rankTier ?? 0) - minorRank) / 10;

					return `${majorRankNameMapping[majorRank]}${
						majorRank < 8 ? ` ${minorRank}` : ""
					}`;
				},
				async matches(parent, args) {
					const limit =
						(args.limit ?? 0) <= 50 ? args.limit ?? 25 : 50;
					const offset = args.offset ?? 0;

					const matchSlotRepo = await postgres.getMatchSlotRepo();
					const slots = await matchSlotRepo.find({
						where: { user: { steamid: parent.steamid } },
						take: limit,
						skip: offset,
						relations: ["match"],
					});

					return slots.map(({ match, slot, finalPlace }) => ({
						matchSlotID: match.id + "#" + slot,
						slot,
						finalPlace,
						user: parent,
					}));
				},
				async mmrHistory({ steamid }, args) {
					// Write influxdb queries to fetch data points
					const queryApi = influx.queryApi();

					let start: FluxParameterLike | undefined = undefined;
					let stop: FluxParameterLike | undefined = undefined;

					if (args.duration) {
						start = fluxDuration(
							`-${args.duration <= 30 ? args.duration : 30}d`,
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
						|> filter(fn: (r) => r["type"] == "standard")
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
