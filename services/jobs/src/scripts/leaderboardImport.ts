import { injectable, inject } from "inversify";
import fetch from "node-fetch";

import { FortifyScript } from "../scripts";

import {
	ULLeaderboard,
	LeaderboardType,
} from "@shared/definitions/leaderboard";
import { RedisConnector } from "@shared/connectors/redis";
import { EventService } from "@shared/services/eventService";
import { Logging } from "@shared/logging";

import { ImportCompletedEvent } from "@shared/events/systemEvents";
import winston from "winston";

const { LEADERBOARD_TYPE = "standard" } = process.env;

@injectable()
export class LeaderboardImportService implements FortifyScript {
	name = "LeaderboardImportService";

	logger: winston.Logger;

	constructor(
		@inject(RedisConnector) private redis: RedisConnector,
		@inject(EventService) private eventService: EventService,
		@inject(Logging) private logging: Logging,
	) {
		this.logger = logging.createLogger();
	}

	async handler() {
		const type = LEADERBOARD_TYPE;

		const leaderboard: ULLeaderboard = await fetch(
			"https://underlords.com/leaderboarddata?type=" + type,
		).then((value) => value.json());

		if ((leaderboard as unknown) === "RequestFailure") {
			this.logger.error(
				`RequestFailure! Could not fetch ${type} leaderboard.`,
			);
			throw new Error(
				`Leaderboard Import: RequestFailure! Could not fetch ${type} leaderboard.`,
			);
		}

		if (!leaderboard.success) {
			this.logger.error(
				`Unsuccessful response! Success boolean in response is false for ${type} leaderboard.`,
			);
			throw new Error(
				`Unsuccessful response! Success boolean in response is false for ${type} leaderboard.`,
			);
		}

		this.logger.info(`${type} leaderboard fetched`);

		await this.redis.setAsync(
			"ul:leaderboard:" + type.toLowerCase(),
			JSON.stringify(leaderboard),
		);

		this.logger.info(`${type} leaderboard stored to redis`);

		const mappedType = type as LeaderboardType;
		if (Object.values(LeaderboardType).includes(mappedType)) {
			const finishedEvent = new ImportCompletedEvent(mappedType);
			await this.eventService.sendEvent(finishedEvent);

			this.logger.info(`Sent ImportCompletedEvent for ${type}`);
		}
	}
}
