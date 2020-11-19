import { config } from "dotenv";
config();

import debug from "debug";

import { sharedSetup } from "@shared/index";
global.__rootdir__ = __dirname || process.cwd();
sharedSetup();

import { captureException, flush } from "@sentry/node";

import { container } from "./inversify.config";

import { KafkaConnector } from "@shared/connectors/kafka";
import { ConsumerCrashEvent } from "kafkajs";

import { FortifyEventTopics, FortifyEvent } from "@shared/events/events";
import {
	SystemEventType,
	ImportCompletedEvent,
} from "@shared/events/systemEvents";
import { GameEventType } from "@shared/events/gameEvents";
import { LeaderboardPersistor } from "./services/leaderboardPersistor";
import { MatchPersistor } from "./services/matchPersistor";
import { Secrets } from "./secrets";
import { HealthCheck } from "@shared/services/healthCheck";

const {
	KAFKA_AUTO_COMMIT,
	KAFKA_GROUP_ID = "historization-group",
} = process.env;

(async () => {
	await container.get(Secrets).getSecrets();

	const healthCheck = container.get(HealthCheck);
	healthCheck.start();

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
				if (!message.value) {
					return;
				}

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
				debug("app::consumer::run")(e);
				const exceptionID = captureException(e, {
					contexts: {
						kafka: {
							topic,
							partition,
							offset: message.offset,
							key: message.key.toString(),
							value: message.value?.toString(),
						},
					},
				});
				debug("app::consumer::run")(exceptionID);

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

	consumer.on("consumer.disconnect", () => {
		debug("app::kafka::consumer.disconnect")("Consumer disconnected");
		// const sentryID = captureMessage("Consumer disconnected");
		// debug("app::kafka::consumer.disconnect")(sentryID);
	});
	consumer.on("consumer.connect", () => {
		debug("app::kafka::consumer.connect")("Consumer connected");
		// const sentryID = captureMessage("Consumer connected");
		// debug("app::kafka::consumer.connect")(sentryID);
	});
	consumer.on("consumer.crash", async (crashEvent: ConsumerCrashEvent) => {
		debug("app::kafka::consumer.crash")(crashEvent);
		const sentryID = captureException(crashEvent.payload.error, {
			extra: {
				groupId: crashEvent.payload.groupId,
			},
		});
		debug("app::kafka::consumer.crash")(sentryID);
		try {
			await flush();
		} finally {
			// eslint-disable-next-line no-process-exit
			process.exit(-1);
		}
	});

	healthCheck.live = true;
})().catch(async (e) => {
	debug("app::anonymous_function")(e);
	const sentryID = captureException(e);
	debug("app::anonymous_function")(sentryID);
	await flush();
});
