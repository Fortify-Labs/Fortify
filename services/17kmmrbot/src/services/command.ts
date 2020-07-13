import { injectable } from "inversify";

import { EachMessagePayload } from "kafkajs";
import { Client } from "tmi.js";

import { FortifyEvent } from "@shared/events/events";
import {
	SystemEventType,
	TwitchLinkedEvent,
} from "@shared/events/systemEvents";

@injectable()
export class BotCommandProcessor {
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
	}
}
