import { config } from "dotenv";
config();

import debug from "debug";

import { sharedSetup } from "@shared/index";
sharedSetup();

import { container } from "./inversify.config";

import { KafkaConnector } from "@shared/connectors/kafka";

import { FortifyEventTopics, FortifyEvent } from "@shared/events/events";
import {
	SystemEventType,
	ImportCompletedEvent,
} from "@shared/events/systemEvents";
import { GameEventType } from "@shared/events/gameEvents";
import { LeaderboardPersistor } from "./services/leaderboardPersistor";
import { MatchPersistor } from "./services/matchPersistor";

const {
	KAFKA_AUTO_COMMIT,
	KAFKA_GROUP_ID = "historization-group",
} = process.env;

(async () => {
	const kafka = container.get(KafkaConnector);

	const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

	const leaderboardPersistor = container.get(LeaderboardPersistor);
	const matchPersistor = container.get(MatchPersistor);

	await consumer.subscribe({
		topic: FortifyEventTopics.SYSTEM,
	});

	await consumer.subscribe({
		topic: FortifyEventTopics.GAME,
	});

	await consumer.run({
		autoCommit: KAFKA_AUTO_COMMIT !== "false" ?? true,
		eachMessage: async ({ message, topic, partition }) => {
			try {
				const value = message.value.toString();

				if (topic === FortifyEventTopics.GAME) {
					const event: FortifyEvent<GameEventType> = JSON.parse(
						value,
					);

					await matchPersistor.handleEvent(event);
				} else if (topic === FortifyEventTopics.SYSTEM) {
					const event: FortifyEvent<SystemEventType> = JSON.parse(
						value,
					);

					if (event.type === SystemEventType.IMPORT_COMPLETED) {
						const importEvent = ImportCompletedEvent.deserialize(
							event,
						);
						await leaderboardPersistor.storeLeaderboard(
							importEvent,
						);
					}
				}
			} catch (e) {
				debug("app::indexCatch")(e);

				// In case something doesn't work for a given topic (e.g. influx down and historization fails)
				// pause the consumption of said topic for 30 seconds
				consumer.pause([{ topic, partitions: [partition] }]);
				// Resume the topics consumption after 15 seconds
				setTimeout(
					() => consumer.resume([{ topic, partitions: [partition] }]),
					15 * 1000,
				);

				throw e;
			}
		},
	});
})().catch(debug("app::anonymous_function"));
