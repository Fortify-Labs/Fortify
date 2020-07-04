import { injectable, inject } from "inversify";
import debug = require("debug");

import { ChatUserstate, Client } from "tmi.js";

import { TwitchCommand } from "../definitions/twitchCommand";
import { KafkaConnector } from "@shared/connectors/kafka";
import { ExtractorService } from "../services/extractor";

import { FortifyFSMCommand, FortifyFSMCommandType } from "@shared/state";

@injectable()
export class DevCommands implements TwitchCommand {
	constructor(
		@inject(KafkaConnector) private kafka: KafkaConnector,
		@inject(ExtractorService) private extractorService: ExtractorService,
	) {}

	invocations = ["!reset"];
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
			const { steamid } = await this.extractorService.getUser(channel);

			if (message === "!reset") {
				const producer = this.kafka.producer();
				await producer.connect();

				const command: FortifyFSMCommand = {
					steamid,
					type: FortifyFSMCommandType.RESET,
				};

				await producer.send({
					messages: [{ value: JSON.stringify(command) }],
					topic: "fsm-commands",
				});

				client.say(
					channel,
					tags["display-name"] + " reset command sent",
				);
			}
		} catch (e) {
			debug("app::devCommands")(e);
		}
	};
}
