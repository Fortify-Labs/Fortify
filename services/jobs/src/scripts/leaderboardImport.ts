import { injectable, inject } from "inversify";
import fetch from "node-fetch";
import debug = require("debug");

import { FortifyScript } from "../scripts";

import {
	ULLeaderboard,
	LeaderboardType,
} from "@shared/definitions/leaderboard";
import { RedisConnector } from "@shared/connectors/redis";
import { KafkaConnector } from "@shared/connectors/kafka";

import { ImportCompletedEvent } from "@shared/events/systemEvents";

const { LEADERBOARD_TYPE = "standard" } = process.env;

@injectable()
export class LeaderboardImportService implements FortifyScript {
	name = "LeaderboardImportService";

	constructor(
		@inject(RedisConnector) private redis: RedisConnector,
		@inject(KafkaConnector) private kafka: KafkaConnector,
	) {}

	async handler() {
		const type = LEADERBOARD_TYPE;

		const leaderboard: ULLeaderboard = await fetch(
			"https://underlords.com/leaderboarddata?type=" + type,
		).then((value) => value.json());

		debug("app::leaderboardImport")(`${type} leaderboard fetched`);

		await this.redis.setAsync(
			"ul_leaderboard_" + type.toLowerCase(),
			JSON.stringify(leaderboard),
		);

		debug("app::leaderboardImport")(`${type} leaderboard stored to redis`);

		const mappedType = type as LeaderboardType;
		if (Object.values(LeaderboardType).includes(mappedType)) {
			const finishedEvent = new ImportCompletedEvent(mappedType);

			// Send the event and disconnect afterwards
			const producer = this.kafka.producer();
			await producer.connect();
			await producer.send({
				messages: [{ value: finishedEvent.serialize() }],
				topic: finishedEvent._topic,
			});
			await producer.disconnect();
		}
	}
}
