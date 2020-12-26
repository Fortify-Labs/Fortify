import { injectable, inject } from "inversify";

import { ChatUserstate, Client } from "tmi.js";

import { TwitchCommand } from "../definitions/twitchCommand";
import { KafkaConnector } from "@shared/connectors/kafka";
import { ExtractorService } from "@shared/services/extractor";

import { FSMResetRequestEvent } from "@shared/events/systemEvents";
import { captureTwitchException } from "../lib/sentryUtils";
import { Logging } from "@shared/logging";
import winston from "winston";

@injectable()
export class DevCommands implements TwitchCommand {
	logger: winston.Logger;

	constructor(
		@inject(KafkaConnector) private kafka: KafkaConnector,
		@inject(ExtractorService) private extractorService: ExtractorService,
		private logging: Logging,
	) {
		this.logger = logging.createLogger();
	}

	invocations = ["!reset", "!join", "!leave", "!version"];

	authorized = async (_channel: string, tags: ChatUserstate) =>
		tags.badges?.broadcaster === "1" ||
		tags["display-name"]?.toLocaleLowerCase() === "greycodes";

	handler = async (
		client: Client,
		channel: string,
		tags: ChatUserstate,
		message: string,
	) => {
		try {
			const isAdmin =
				tags["display-name"]?.toLocaleLowerCase() === "greycodes";

			const { steamid } = await this.extractorService.getUser(channel);

			const msg = message.trim().toLocaleLowerCase();

			if (msg === "!reset") {
				const producer = this.kafka.producer();
				await producer.connect();

				const event = new FSMResetRequestEvent(steamid);

				await producer.send({
					messages: [{ value: event.serialize() }],
					topic: event._topic,
				});

				await client.say(
					channel,
					tags["display-name"] + " reset command sent",
				);
			}

			if (isAdmin && msg.startsWith("!join")) {
				try {
					const channelName = msg.substr(5, msg.length).trim();

					await client.join(channelName);
				} catch (e) {
					const exceptionID = captureTwitchException(
						e,
						channel,
						tags,
						message,
					);
					this.logger.error("Join command failed", {
						exceptionID,
						e,
						channel,
						tags,
						message,
						command: "!join",
					});
					this.logger.error(e, {
						exceptionID,
						channel,
						tags,
						message,
						command: "!join",
					});
				}
			}

			if (isAdmin && msg.startsWith("!leave")) {
				try {
					const channelName = msg.substr(5, msg.length).trim();

					await client.part(channelName);
				} catch (e) {
					const exceptionID = captureTwitchException(
						e,
						channel,
						tags,
						message,
					);
					this.logger.error("Leave command failed", {
						exceptionID,
						e,
						channel,
						tags,
						message,
						command: "!leave",
					});
					this.logger.error(e, {
						exceptionID,
						channel,
						tags,
						message,
						command: "!leave",
					});
				}
			}

			if (msg.startsWith("!version")) {
				await client.say(
					channel,
					"Version: " + process.env.npm_package_version,
				);
			}
		} catch (e) {
			const exceptionID = captureTwitchException(
				e,
				channel,
				tags,
				message,
			);
			this.logger.error("A dev command failed", {
				exceptionID,
				e,
				channel,
				tags,
				message,
				command: "!dev",
			});
			this.logger.error(e, {
				exceptionID,
				channel,
				tags,
				message,
				command: "!dev",
			});
		}
	};
}
