import { injectable, inject } from "inversify";

import { TwitchCommand } from "../definitions/twitchCommand";
import { ChatUserstate, Client } from "tmi.js";

import { ExtractorService } from "@shared/services/extractor";
import debug from "debug";
import { captureTwitchException } from "../lib/sentryUtils";

@injectable()
export class MatchCommand implements TwitchCommand {
	constructor(
		@inject(ExtractorService) private extractorService: ExtractorService,
	) {}

	invocations = ["!match"];
	description = "View the current match on fortify.gg";
	showInHelp = true;

	async handler(
		client: Client,
		channel: string,
		tags: ChatUserstate,
		message: string,
	): Promise<unknown> {
		try {
			const user = await this.extractorService.getUser(channel);

			client.say(channel, `https://fortify.gg/lobby/${user.steamid}`);
		} catch (e) {
			debug("app::match")(e);
			const exceptionID = captureTwitchException(
				e,
				channel,
				tags,
				message,
			);
			await client.say(
				channel,
				`Something went wrong. (Exception ID: ${exceptionID})`,
			);
		}

		return;
	}
}
