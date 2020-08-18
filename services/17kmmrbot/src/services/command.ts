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

@injectable()
export class BotCommandProcessor {
	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
	) {}

	async process(payload: EachMessagePayload, client: Client) {
		const message: FortifyEvent<SystemEventType> = JSON.parse(
			payload.message.value.toString(),
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
				await client.say(channel, event.message);
				await sleep(1000);
			}
		}
	}
}

const sleep = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
