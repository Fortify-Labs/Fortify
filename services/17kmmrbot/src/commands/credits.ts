import { TwitchCommand } from "definitions/twitchCommand";
import { Client, ChatUserstate } from "tmi.js";
import { injectable } from "inversify";

@injectable()
export class CreditsCommand implements TwitchCommand {
	invocations = ["!credit"];

	handler = async (
		client: Client,
		channel: string,
		tags: ChatUserstate,
		message: string,
	) => {
		if (message.toLowerCase().startsWith("!credit")) {
			client.say(
				channel,
				"Check out https://fortify.gg & https://github.com/Fortify-Labs/Fortify",
			);
		}
	};
}
