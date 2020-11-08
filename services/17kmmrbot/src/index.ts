import "reflect-metadata";

import * as dotenv from "dotenv";
dotenv.config();
import debug = require("debug");

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

const {
	KAFKA_FROM_START = "false",
	KAFKA_GROUP_ID = "17kmmrbot-group",
} = process.env;

(async () => {
	const commands = container.getAll<TwitchCommand>("command");
	const helpCommand = container.get<TwitchCommand>(HelpCommand);

	const postgres = container.get(PostgresConnector);
	const userRepo = await postgres.getUserRepo();
	const channels = await (
		await userRepo.find({
			select: ["twitchName"],
			where: { suspended: false },
		})
	)
		.map((channel) => channel.twitchName ?? "")
		.filter((value) => value);

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
			password: process.env.OAUTH_TOKEN,
			username: process.env.BOT_USERNAME,
		},
	};

	const client = Client(options);

	process.on("SIGTERM", shutDown);
	process.on("SIGINT", shutDown);

	async function shutDown() {
		try {
			await Promise.allSettled([
				(await postgres.connection).close(),
				consumer.disconnect(),
				container.get(RedisConnector).client.quit(),
				client.disconnect(),
				flush(10000),
			]);
			debug("app::shutDown")("Postgres connection closed");
			debug("app::shutDown")("Kafka consumer closed");
			debug("app::shutDown")("Redis connection closed");
			debug("app::shutDown")("Twitch connection closed");
			debug("app::shutDown")("Flushed sentry");
		} catch (e) {
			debug("app::shutDown")(e);
		} finally {
			debug("app::shutDown")(
				"Received kill signal, shutting down gracefully",
			);

			// eslint-disable-next-line no-process-exit
			process.exit(0);
		}
	}

	await consumer.run({
		autoCommit: KAFKA_FROM_START !== "true",
		eachMessage: async (payload) => {
			commandProcessor
				.process(payload, client)
				.catch(debug("app::consumerRun"));

			return;
		},
	});

	client.on("message", async (channel, tags, message, self) => {
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
					}
				}
			}
		} catch (e) {
			debug("app::message")(e);
			captureTwitchException(e, channel, tags, message);
		}
	});

	client.on("connected", (address, port) => {
		debug("app::main::connected")(address, port);
		captureMessage("Twitch bot connected", {
			contexts: {
				arguments: {
					address,
					port,
				},
			},
		});
	});

	const connected = await client.connect();

	client.on("disconnected", async (reason) => {
		debug("app::main::disconnected")(reason);
		captureMessage("Twitch bot disconnected", {
			extra: {
				reason,
			},
		});
	});

	debug("app::main")("Twitch bot connected");
	debug("app::main")(connected);
})().catch((e) => {
	debug("app::main")(e);
	captureException(e);
});
