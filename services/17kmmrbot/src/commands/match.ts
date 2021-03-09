import { injectable, inject } from "inversify";

import { TwitchCommand } from "../definitions/twitchCommand";
import { ChatUserstate, Client } from "tmi.js";

import { ExtractorService } from "@shared/services/extractor";
import { captureTwitchException } from "../lib/sentryUtils";
import { Logger } from "@shared/logger";
import { StateService } from "@shared/services/state";

@injectable()
export class MatchCommand implements TwitchCommand {
	constructor(
		@inject(ExtractorService) private extractorService: ExtractorService,
		@inject(Logger) private logger: Logger,
		@inject(StateService) private stateService: StateService,
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
			const matchID = await this.stateService.getUserMatchID(
				user.steamid,
			);

			if (matchID) {
				await client.say(
					channel,
					`https://fortify.gg/match/${encodeURIComponent(matchID)}`,
				);
			} else {
				const userCache = await this.stateService.getUserCache(
					user.steamid,
				);

				if (Object.values(userCache.players).length > 0) {
					await client.say(
						channel,
						"Collecting game data, please try again in a little bit",
					);
				} else {
					await client.say(channel, "No match detected yet");
				}
			}
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
