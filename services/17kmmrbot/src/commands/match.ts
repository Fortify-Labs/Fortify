import { injectable, inject } from "inversify";

import { TwitchCommand } from "../definitions/twitchCommand";
import { Client } from "tmi.js";

import { ExtractorService } from "@shared/services/extractor";
import debug from "debug";

@injectable()
export class MatchCommand implements TwitchCommand {
	constructor(
		@inject(ExtractorService) private extractorService: ExtractorService,
	) {}

	invocations = ["!match"];
	description = "View the current match on fortify.gg";
	showInHelp = true;

	async handler(client: Client, channel: string): Promise<unknown> {
		try {
			const user = await this.extractorService.getUser(channel);

			client.say(channel, `https://fortify.gg/lobby/${user.steamid}`);
		} catch (e) {
			client.say(channel, "Something went wrong");
			debug("app::match")(e);
		}

		return;
	}
}
