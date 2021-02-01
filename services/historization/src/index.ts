import { config } from "dotenv";
config();

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
import { Connector } from "@shared/definitions/connector";
import { Logger } from "@shared/logger";

const {
	KAFKA_AUTO_COMMIT,
	KAFKA_GROUP_ID = "historization-group",
} = process.env;

(async () => {
	const logger = container.get(Logger);

	await container.get(Secrets).getSecrets();

	await Promise.all(
		container
			.getAll<Connector>("connector")
			.map((connector) => connector.connect()),
	);

	const healthCheck = container.get(HealthCheck);
	await healthCheck.start();

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
				const exceptionID = captureException(e, {
					contexts: {
						kafka: {
							topic,
							partition,
							offset: message.offset,
							key: message.key?.toString() || "undefined",
							value: message.value?.toString(),
						},
					},
				});
				logger.error("Consumer run failed", {
					e,
					exceptionID,
				});
				logger.error(e, { exceptionID });

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
		logger.warn("Kafka Consumer disconnected");
		// const sentryID = captureMessage("Consumer disconnected");
		// debug("app::kafka::consumer.disconnect")(sentryID);
	});
	consumer.on("consumer.connect", () => {
		logger.info("Kafka consumer connected");
		// const sentryID = captureMessage("Consumer connected");
		// debug("app::kafka::consumer.connect")(sentryID);
	});
	consumer.on("consumer.crash", async (crashEvent: ConsumerCrashEvent) => {
		const exceptionID = captureException(crashEvent.payload.error, {
			extra: {
				groupId: crashEvent.payload.groupId,
			},
		});
		logger.error("Kafka consumer crashed", {
			crashEvent,
			exceptionID,
		});
		try {
			await flush();
		} finally {
			// eslint-disable-next-line no-process-exit
			process.exit(-1);
		}
	});

	process.on("SIGTERM", shutDown);
	process.on("SIGINT", shutDown);

	async function shutDown() {
		await flush(10000).catch(() => {});

		setTimeout(() => {
			logger.warn(
				"Could not close connections in time, forcefully shutting down",
			);
			// eslint-disable-next-line no-process-exit
			process.exit(1);
		}, 10000);

		try {
			await consumer.stop();
			await consumer.disconnect();

			logger.info("Received kill signal, shutting down gracefully");

			// eslint-disable-next-line no-process-exit
			process.exit(0);
		} finally {
			logger.info("Received kill signal, finally shutting down");
		}
	}

	healthCheck.live = true;
})().catch(async (e) => {
	const logger = container.get(Logger);

	const exceptionID = captureException(e);

	logger.error("An exception occurred in the main context", {
		e,
		exceptionID,
	});

	logger.error(e, { exceptionID });

	await flush();
});
