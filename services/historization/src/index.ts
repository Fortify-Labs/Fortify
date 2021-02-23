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
import { MetricsService, servicePrefix } from "@shared/services/metrics";
import { Summary } from "prom-client";

const {
	KAFKA_AUTO_COMMIT = "true",
	KAFKA_GROUP_ID = "historization-group",
	KAFKA_HEARTBEAET_INTERVAL = "3000",
	KAFKA_AUTO_COMMIT_INTERVAL = "5000",
	KAFKA_AUTO_COMMIT_THRESHOLD = "100",
	KAFKA_ALWAYS_RESOLVE_OFFSET = "false",
	OMIT_TOPICS = "",
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

	const metrics = container.get(MetricsService);
	await metrics.start();

	const messageSummary = new Summary({
		name: `${servicePrefix}_processed_messages`,
		help: "Summary of duration & outcomes of processed kafka messages",
		registers: [metrics.register],
		labelNames: ["topic", "status", "type"],
		maxAgeSeconds: 600,
		ageBuckets: 5,
	});

	const kafka = container.get(KafkaConnector);

	const consumer = kafka.consumer({
		groupId: KAFKA_GROUP_ID,
		heartbeatInterval: parseInt(KAFKA_HEARTBEAET_INTERVAL),
	});

	const leaderboardPersistor = container.get(LeaderboardPersistor);
	const matchPersistor = container.get(MatchPersistor);

	if (!OMIT_TOPICS.split(",").includes(FortifyEventTopics.SYSTEM)) {
		await consumer.subscribe({
			topic: FortifyEventTopics.SYSTEM,
		});
	}

	if (!OMIT_TOPICS.split(",").includes(FortifyEventTopics.GAME)) {
		await consumer.subscribe({
			topic: FortifyEventTopics.GAME,
		});
	}

	await consumer.run({
		autoCommit: KAFKA_AUTO_COMMIT !== "false",
		autoCommitInterval: parseInt(KAFKA_AUTO_COMMIT_INTERVAL),
		autoCommitThreshold: parseInt(KAFKA_AUTO_COMMIT_THRESHOLD),
		eachBatchAutoResolve: false,
		eachBatch: async ({
			batch,
			resolveOffset,
			heartbeat,
			commitOffsetsIfNecessary,
			isRunning,
			isStale,
		}) => {
			await heartbeat();
			const intervalId = setInterval(async () => {
				try {
					logger.debug("Sending heartbeat");
					await heartbeat();
					logger.debug("Sent heartbeat");
				} catch (e) {
					const exceptionID = captureException(e, {
						contexts: {
							kafka: {
								topic,
								partition,
							},
						},
					});
					logger.error("Failed to send heartbeat to Kafka", {
						e,
						exceptionID,
					});
					logger.error(e, { exceptionID });
				}
			}, parseInt(KAFKA_HEARTBEAET_INTERVAL));

			logger.debug("Processing batch");

			const { messages, topic, partition } = batch;
			for (const message of messages) {
				if (!isRunning() || isStale()) break;

				const end = messageSummary.labels({ topic }).startTimer();

				try {
					if (!message.value) {
						end({ status: 404 });
						continue;
					}

					const value = message.value.toString();

					if (topic === FortifyEventTopics.GAME) {
						const event: FortifyEvent<GameEventType> = JSON.parse(
							value,
						);

						await matchPersistor.handleEvent(event);

						end({ status: 200, type: event.type });
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

						end({ status: 200, type: event.type });
					} else {
						end({ status: 501 });
					}

					if (KAFKA_ALWAYS_RESOLVE_OFFSET === "true") {
						resolveOffset(message.offset);
					} else {
						await commitOffsetsIfNecessary();
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

					// In case something doesn't work for a given topic (e.g. time series db down and historization fails)
					// pause the consumption of said topic for 30 seconds
					consumer.pause([{ topic, partitions: [partition] }]);
					// Resume the topics consumption after 15 seconds
					setTimeout(
						() =>
							consumer.resume([
								{ topic, partitions: [partition] },
							]),
						15 * 1000,
					);

					end({ status: 500 });

					clearInterval(intervalId);

					throw e;
				}
			}

			logger.debug("Finished processing batch");

			clearInterval(intervalId);
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
