import { injectable, inject } from "inversify";
import debug from "debug";

import { Point } from "@influxdata/influxdb-client";
import fetch from "node-fetch";

import {
	ImportCompletedEvent,
	HistorizationCompletedEvent,
} from "@shared/events/systemEvents";
import { InfluxDBConnector } from "@shared/connectors/influxdb";
import { RedisConnector } from "@shared/connectors/redis";
import { PostgresConnector } from "@shared/connectors/postgres";
import { ULLeaderboard } from "@shared/definitions/leaderboard";
import { GetPlayerSummaries } from "@shared/definitions/playerSummaries";

import { convert32to64SteamId, convert64to32SteamId } from "@shared/steamid";
import { EventService } from "@shared/services/eventService";

const { STEAM_WEB_API_KEY } = process.env;

@injectable()
export class LeaderboardPersistor {
	constructor(
		@inject(InfluxDBConnector) private influx: InfluxDBConnector,
		@inject(RedisConnector) private redis: RedisConnector,
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(EventService) private eventService: EventService,
	) {}

	async storeLeaderboard(event: ImportCompletedEvent) {
		// Fetch corresponding leaderboard from redis
		const leaderboardType = event.leaderboardType;
		const rawLeaderboard = await this.redis.getAsync(
			`ul:leaderboard:${leaderboardType}`,
		);

		if (!rawLeaderboard) {
			return debug("app::storeLeaderboard")(
				"No leaderboard found in redis",
			);
		}

		const leaderboard: ULLeaderboard = JSON.parse(rawLeaderboard);

		// Fetch current users from postgres
		const userRepo = await this.postgres.getUserRepo();
		const steamids = (
			await userRepo.find({
				select: ["steamid"],
				// Fetch for all registered lords; This is to avoid privacy infringements
				where: { rankTier: 80, registered: true },
			})
		).map((channel) => channel.steamid);

		// Create an array containing arrays of steamids which at max have 100 steamids, as this is a limitation of the steam web api

		const chunkedSteamIDs = steamids.reduce<Array<string[]>>(
			(acc, steamid, idx) => {
				const arrayIdxToPushTo = Math.floor(idx / 100);

				if (!acc[arrayIdxToPushTo]) {
					acc[arrayIdxToPushTo] = [];
				}

				// Convert the steamid to 64 bit for the web api
				acc[arrayIdxToPushTo].push(
					convert32to64SteamId(steamid).toString(),
				);

				return acc;
			},
			[],
		);

		// Send requests to steam web api to get current display names
		const requests = chunkedSteamIDs.map((steamids) =>
			fetch(
				`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_WEB_API_KEY}&steamids=${steamids.join(
					",",
				)}`,
			).then((res) => res.json() as Promise<GetPlayerSummaries>),
		);
		const responses = await Promise.allSettled(requests);

		interface MappedUser {
			name: string;
			steamid: string;
		}

		const mappings = responses.reduce<Record<string, MappedUser>>(
			(acc, response) => {
				if (response.status === "fulfilled") {
					for (const player of response.value.response.players) {
						// Convert the steamid back to 32 bit, as we are working with the 32 bit version
						const steamid = convert64to32SteamId(
							player.steamid,
						).toString();

						acc[steamid] = {
							name: player.personaname,
							steamid,
						};
					}
				}

				return acc;
			},
			{},
		);

		interface MappedLeaderboardEntry {
			steamid: string;
			mmr: number;
			rank: number;
		}

		// Map current display names to leaderboard entries
		const mappedLeaderboard = Object.values(mappings).reduce<
			MappedLeaderboardEntry[]
		>((acc, { steamid, name }) => {
			// Find the given name in the leaderboard

			// If multiple entries with the same name exist, generate multiple points with the specified display name
			if (leaderboard.success) {
				const entries = leaderboard.leaderboard.filter(
					(entry) => entry.name === name,
				);

				for (const entry of entries) {
					acc.push({
						mmr: entry.level_score,
						rank: entry.rank,
						steamid,
					});
				}
			}

			return acc;
		}, []);

		// Save mmr and leaderboard rank to influx
		const points = mappedLeaderboard.map(({ mmr, rank, steamid }) =>
			new Point("mmr")
				.intField("mmr", mmr)
				.intField("rank", rank)
				.tag("steamid", steamid)
				.tag("type", leaderboardType),
		);

		await this.influx.writePoints(points);

		debug("app::leaderboardPersistor")(
			`Successfully persisted ${points.length} data points for ${leaderboardType}`,
		);

		// Send historization finished event
		const finishedEvent = new HistorizationCompletedEvent(leaderboardType);
		await this.eventService.sendEvent(finishedEvent);

		debug("app::leaderboardPersistor")(
			`Sent HistorizationCompletedEvent for ${leaderboardType}`,
		);
	}
}
