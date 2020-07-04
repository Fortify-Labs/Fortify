import "reflect-metadata";

import * as dotenv from "dotenv";
dotenv.config();
import debug = require("debug");

import { Client, Options } from "tmi.js";

import { container } from "./inversify.config";
import { PostgresConnector } from "@shared/connectors/postgres";

import { TwitchCommand } from "./definitions/twitchCommand";

(async () => {
	const commands = container.getAll<TwitchCommand>("command");

	const postgres = container.get(PostgresConnector);
	const userRepo = await postgres.getUserRepo();
	const channels = await (await userRepo.find({ select: ["twitch_name"] }))
		.map((channel) => channel.twitch_name ?? "")
		.filter((value) => value);

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

	client.on("message", async (channel, tags, message, self) => {
		try {
			// Ignore echoed messages.
			if (self) return;

			for (const command of commands) {
				if (
					command.invocations.includes(message.toLowerCase()) &&
					!(command.timeout !== undefined
						? await command.timeout(channel, tags, message)
						: false) &&
					(command.authorized !== undefined
						? await command.authorized(channel, tags, message)
						: true)
				) {
					await command.handler(client, channel, tags, message);
				}
			}
		} catch (e) {
			debug("app::message")(e);
		}
	});

	const connected = await client.connect();

	debug("app::main")("Twitch bot connected");
	debug("app::main")(connected);

	process.on("SIGTERM", shutDown);
	process.on("SIGINT", shutDown);

	async function shutDown() {
		try {
			(await postgres.connection).close();
		} finally {
			debug("app::shutdown")(
				"Received kill signal, shutting down gracefully",
			);

			// eslint-disable-next-line no-process-exit
			process.exit(0);
		}
	}
})().catch(debug("app::main"));
