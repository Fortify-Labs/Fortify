import { injectable, inject } from "inversify";
import debug = require("debug");

import { ChatUserstate, Client } from "tmi.js";

import { TwitchCommand } from "../definitions/twitchCommand";
import { KafkaConnector } from "@shared/connectors/kafka";
import { ExtractorService } from "../services/extractor";

import { FSMResetRequestEvent } from "@shared/events/systemEvents";

@injectable()
export class DevCommands implements TwitchCommand {
	constructor(
		@inject(KafkaConnector) private kafka: KafkaConnector,
		@inject(ExtractorService) private extractorService: ExtractorService,
	) {}

	invocations = ["!reset", "!join", "!leave"];

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
					debug("app::devCommands::join")(e);
				}
			}

			if (isAdmin && msg.startsWith("!leave")) {
				try {
					const channelName = msg.substr(5, msg.length).trim();

					await client.part(channelName);
				} catch (e) {
					debug("app::devCommands::leave")(e);
				}
			}
		} catch (e) {
			debug("app::devCommands")(e);
		}
	};
}
