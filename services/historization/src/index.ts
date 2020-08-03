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
import { LeaderboardPersistor } from "./services/leaderboardPersistor";

const {
	KAFKA_FROM_START,
	KAFKA_START_OFFSET,
	KAFKA_START_OFFSET_PARTITION = "0",
	KAFKA_AUTO_COMMIT,
	KAFKA_GROUP_ID = "historization-group",
} = process.env;

(async () => {
	const kafka = container.get(KafkaConnector);

	const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

	const leaderboardPersistor = container.get(LeaderboardPersistor);

	await consumer.subscribe({
		topic: FortifyEventTopics.SYSTEM,
	});

	consumer.run({
		autoCommit: KAFKA_AUTO_COMMIT !== "false" ?? true,
		eachMessage: async ({ message, topic }) => {
			try {
				const value = message.value.toString();

				if (topic === FortifyEventTopics.SYSTEM) {
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
			}
		},
	});

	if (KAFKA_START_OFFSET) {
		consumer.seek({
			offset: KAFKA_START_OFFSET,
			partition: parseInt(KAFKA_START_OFFSET_PARTITION),
			topic: "gsi",
		});
	}
})().catch(debug("app::anonymous_function"));
