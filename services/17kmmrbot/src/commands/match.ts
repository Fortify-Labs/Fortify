import { injectable, inject } from "inversify";

import { TwitchCommand } from "../definitions/twitchCommand";
import { ChatUserstate, Client } from "tmi.js";

import { ExtractorService } from "@shared/services/extractor";
import { captureTwitchException } from "../lib/sentryUtils";
import { Logging } from "@shared/logging";
import winston from "winston";

@injectable()
export class MatchCommand implements TwitchCommand {
	logger: winston.Logger;

	constructor(
		@inject(ExtractorService) private extractorService: ExtractorService,
		private logging: Logging,
	) {
		this.logger = logging.createLogger();
	}

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
			const exceptionID = captureTwitchException(
				e,
				channel,
				tags,
				message,
			);

			this.logger.error(
				"An exception occurred during the execution of the match command",
				{
					exceptionID,
					e,
					channel,
					tags,
					message,
					command: "!match",
				},
			);
			this.logger.error(e, {
				exceptionID,
				channel,
				tags,
				message,
				command: "!match",
			});

			await client.say(
				channel,
				`Something went wrong. (Exception ID: ${exceptionID})`,
			);
		}

		return;
	}
}
