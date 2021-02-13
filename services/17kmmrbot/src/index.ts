import "reflect-metadata";

import * as dotenv from "dotenv";
dotenv.config();

import { Client, Options } from "tmi.js";

import { container } from "./inversify.config";
import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";

import { TwitchCommand } from "./definitions/twitchCommand";
import { BotCommandProcessor } from "./services/command";

import { FortifyEventTopics } from "@shared/events/events";

import { HelpCommand } from "./commands/help";

import { sharedSetup } from "@shared/index";
global.__rootdir__ = __dirname || process.cwd();
sharedSetup();
import {
	captureException,
	captureMessage,
	startTransaction,
	flush,
} from "@sentry/node";
import { captureTwitchException } from "./lib/sentryUtils";
import { ConsumerCrashEvent } from "kafkajs";
import { Secrets } from "./secrets";
import { HealthCheck } from "@shared/services/healthCheck";

import { Logger } from "@shared/logger";
import { Connector } from "@shared/definitions/connector";
import { MetricsService, servicePrefix } from "@shared/services/metrics";
import { Gauge, Summary } from "prom-client";

const {
	KAFKA_FROM_START = "false",
	KAFKA_GROUP_ID = "17kmmrbot-group",
} = process.env;

(async () => {
	const logger = container.get(Logger);

	const {
		twitchBot: { oauthToken },
	} = await container.get(Secrets).getSecrets();

	await Promise.all(
		container
			.getAll<Connector>("connector")
			.map((connector) => connector.connect()),
	);

	const healthCheck = container.get(HealthCheck);
	await healthCheck.start();

	const metrics = container.get(MetricsService);
	await metrics.start();

	const channelsGauge = new Gauge({
		name: `${servicePrefix}_channels`,
		help: "Gauge counting the amount of joined twitch channels",
		registers: [metrics.register],
	});

	const twitchCommandSummary = new Summary({
		name: `${servicePrefix}_commands`,
		help: "Summary of duration & outcomes of invoked twitch commands",
		registers: [metrics.register],
		labelNames: ["command", "status"],
		maxAgeSeconds: 600,
		ageBuckets: 5,
	});

	const commands = container.getAll<TwitchCommand>("command");
	const helpCommand = container.get<TwitchCommand>(HelpCommand);

	const postgres = container.get(PostgresConnector);
	const userRepo = await postgres.getUserRepo();
	const channels = (
		await userRepo.find({
			select: ["twitchName"],
			where: { suspended: false },
		})
	)
		.map((channel) => channel.twitchName ?? "")
		.filter((value) => value);

	channelsGauge.set(channels.length);

	const commandProcessor = container.get(BotCommandProcessor);
	const kafka = container.get(KafkaConnector);
	const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

	consumer.subscribe({
		fromBeginning: KAFKA_FROM_START === "true",
		topic: FortifyEventTopics.SYSTEM,
	});

	const options: Options = {
		channels,
		connection: {
			reconnect: true,
			secure: true,
		},
		identity: {
			password: oauthToken,
			username: process.env.BOT_USERNAME,
		},
	};

	const client = Client(options);

	process.on("SIGTERM", shutDown);
	process.on("SIGINT", shutDown);

	async function shutDown() {
		try {
			await Promise.allSettled([
				postgres.shutdown(),
				consumer.disconnect(),
				container.get(RedisConnector).shutdown(),
				client.disconnect(),
				flush(10000),
			]);
			logger.info("Closed all remaining connections and flushed sentry");
		} catch (e) {
			logger.error("An error occurred while closing connections", { e });
			logger.error(e);
		} finally {
			logger.info("Received kill signal, shutting down gracefully");

			// eslint-disable-next-line no-process-exit
			process.exit(0);
		}
	}

	consumer.on("consumer.disconnect", () => {
		logger.info("Kafka consumer disconnected");
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
		logger.error("Kafka consumer crashed", { crashEvent, exceptionID });
		try {
			await flush(10000);
		} finally {
			// eslint-disable-next-line no-process-exit
			process.exit(-1);
		}
	});

	await consumer.run({
		autoCommit: KAFKA_FROM_START !== "true",
		eachMessage: async (payload) => {
			commandProcessor
				.process(payload, client)
				.catch(
					(e) =>
						logger.error("Consumer run failed", { e }) &&
						logger.error(e),
				);

			return;
		},
	});

	client.on("message", async (channel, tags, message, self) => {
		const end = twitchCommandSummary.startTimer();
		try {
			// Ignore echoed messages.
			if (self) return;

			for (const command of [...commands, helpCommand]) {
				const invoked = command.invocations.reduce(
					(acc, invocation) =>
						acc ||
						message
							.toLowerCase()
							.startsWith(invocation.toLowerCase()),
					false,
				);

				if (invoked) {
					const timedOut =
						command.timeout !== undefined
							? await command.timeout(channel, tags, message)
							: false;

					const authorized =
						command.authorized !== undefined
							? await command.authorized(channel, tags, message)
							: true;

					if (!timedOut && authorized) {
						const transaction = startTransaction({
							name: message.toLowerCase().split(" ")[0],
							op: "twitchCommand",
							data: {
								channel,
							},
						});
						await command.handler(client, channel, tags, message);
						transaction.finish();

						end({ command: command.invocations[0], status: 200 });
					} else {
						end({ command: command.invocations[0], status: 401 });
					}
				} else {
					end({ status: 404 });
				}
			}
		} catch (e) {
			const exceptionID = captureTwitchException(
				e,
				channel,
				tags,
				message,
			);
			logger.error(
				"An error occurred while processing a twitch message",
				{
					exceptionID,
					e,
					channel,
					tags,
					message,
				},
			);
			logger.error(e, {
				exceptionID,
				channel,
				tags,
				message,
			});
			await client.say(
				channel,
				`Something went wrong. (Exception ID: ${exceptionID})`,
			);
			end({ status: 500 });
		}
	});

	client.on("connected", (address, port) => {
		const messageID = captureMessage("Twitch bot connected", {
			contexts: {
				arguments: {
					address,
					port,
				},
			},
		});
		logger.info("Connected to Twitch", { address, port, messageID });
	});

	const connected = await client.connect();

	client.on("disconnected", async (reason) => {
		const messageID = captureMessage("Twitch bot disconnected", {
			extra: {
				reason,
			},
		});

		logger.info("Disconnected from Twitch", { reason, messageID });
	});

	logger.info("Twitch bot connected", { connected });

	healthCheck.live = true;
})().catch((e) => {
	const exceptionID = captureException(e);
	const logger = container.get(Logger);
	logger.error("An error occurred in the main context", { e, exceptionID });
	logger.error(e, { exceptionID });

	flush(10000)
		.catch(() => {})
		// eslint-disable-next-line no-process-exit
		.finally(() => process.exit(-1));
});
