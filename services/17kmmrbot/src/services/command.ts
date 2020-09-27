import { injectable, inject } from "inversify";

import { EachMessagePayload } from "kafkajs";
import { Client } from "tmi.js";

import { FortifyEvent } from "@shared/events/events";
import {
	SystemEventType,
	TwitchLinkedEvent,
	TwitchMessageBroadcastEvent,
} from "@shared/events/systemEvents";
import { PostgresConnector } from "@shared/connectors/postgres";
import { convertMS } from "../lib/dateUtils";

const { BOT_BROADCAST_DISABLED } = process.env;

@injectable()
export class BotCommandProcessor {
	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
	) {}

	async process(payload: EachMessagePayload, client: Client) {
		const message: FortifyEvent<SystemEventType> = JSON.parse(
			(payload.message.value ?? "{}").toString(),
		);

		if (message.type === SystemEventType.TWITCH_LINKED) {
			const event = TwitchLinkedEvent.deserialize(message);

			await client.join(event.twitchName);
		}

		if (message.type === SystemEventType.TWITCH_UNLINKED) {
			const event = TwitchLinkedEvent.deserialize(message);

			await client.part(event.twitchName);
		}

		if (message.type === SystemEventType.TWITCH_MESSAGE_BROADCAST) {
			const event = TwitchMessageBroadcastEvent.deserialize(message);

			const userRepo = await this.postgres.getUserRepo();
			const channels = await (
				await userRepo.find({ select: ["twitchName"] })
			)
				.map((channel) => channel.twitchName ?? "")
				.filter((value) => value);

			for (const channel of channels) {
				if (BOT_BROADCAST_DISABLED !== "true") {
					if (event.message.startsWith("!date")) {
						const dateString = event.message.replace("!date ", "");

						const goalDate = new Date(dateString);
						const now = new Date();

						const diff = goalDate.getTime() - now.getTime();
						const converted = convertMS(diff);

						await client.say(
							channel,
							`${converted.day * 24 + converted.hour}:${
								converted.minute < 10
									? "0" + converted.minute
									: converted.minute
							}:${
								converted.seconds < 10
									? "0" + converted.seconds
									: converted.seconds
							}`,
						);
					} else {
						await client.say(channel, event.message);
					}
				}
				await sleep(2000);
			}
		}
	}
}

const sleep = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
