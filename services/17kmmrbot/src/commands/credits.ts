import { TwitchCommand } from "definitions/twitchCommand";
import { Client } from "tmi.js";
import { injectable } from "inversify";

@injectable()
export class CreditsCommand implements TwitchCommand {
	invocations = ["!credit", "!fortify"];

	handler = async (client: Client, channel: string) => {
		client.say(
			channel,
			"Check out https://fortify.gg & https://github.com/Fortify-Labs/Fortify",
		);
	};
}
