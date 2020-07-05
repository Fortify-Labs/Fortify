import { injectable } from "inversify";

import { EachMessagePayload } from "kafkajs";
import { Client } from "tmi.js";

import {
	Fortify17kmmrCommand,
	Fortify17kmmrCommandType,
} from "@shared/17kmmrbot";

@injectable()
export class BotCommandProcessor {
	async process(payload: EachMessagePayload, client: Client) {
		const message: Fortify17kmmrCommand = JSON.parse(
			payload.message.value.toString(),
		);

		if (message.type === Fortify17kmmrCommandType.JOIN) {
			await client.join(message.channel);
		}

		if (message.type === Fortify17kmmrCommandType.LEAVE) {
			await client.join(message.channel);
		}

		if (message.type === Fortify17kmmrCommandType.SAY) {
			const msg = (message.payload
				? message.payload["message"]
				: null) as string | null;

			if (msg) {
				client.say(message.channel, msg);
			}
		}
	}
}
