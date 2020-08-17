import { injectable, inject } from "inversify";
import fetch from "node-fetch";
import debug = require("debug");

import { FortifyScript } from "../scripts";

import {
	ULLeaderboard,
	LeaderboardType,
} from "@shared/definitions/leaderboard";
import { RedisConnector } from "@shared/connectors/redis";
import { EventService } from "@shared/services/eventService";

import { ImportCompletedEvent } from "@shared/events/systemEvents";

const { LEADERBOARD_TYPE = "standard" } = process.env;

@injectable()
export class LeaderboardImportService implements FortifyScript {
	name = "LeaderboardImportService";

	constructor(
		@inject(RedisConnector) private redis: RedisConnector,
		@inject(EventService) private eventService: EventService,
	) {}

	async handler() {
		const type = LEADERBOARD_TYPE;

		const leaderboard: ULLeaderboard = await fetch(
			"https://underlords.com/leaderboarddata?type=" + type,
		).then((value) => value.json());

		if ((leaderboard as unknown) === "RequestFailure") {
			debug("app::leaderboardImport")(
				`RequestFailure! Could not fetch ${type} leaderboard.`,
			);
			return;
		}

		debug("app::leaderboardImport")(`${type} leaderboard fetched`);

		await this.redis.setAsync(
			"ul:leaderboard:" + type.toLowerCase(),
			JSON.stringify(leaderboard),
		);

		debug("app::leaderboardImport")(`${type} leaderboard stored to redis`);

		const mappedType = type as LeaderboardType;
		if (Object.values(LeaderboardType).includes(mappedType)) {
			const finishedEvent = new ImportCompletedEvent(mappedType);
			await this.eventService.sendEvent(finishedEvent);

			debug("app::leaderboardImport")(
				`Sent ImportCompletedEvent for ${type}`,
			);
		}
	}
}
