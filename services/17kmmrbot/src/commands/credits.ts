import { TwitchCommand } from "src/definitions/twitchCommand";
import { Client, ChatUserstate } from "tmi.js";
import { injectable } from "inversify";

@injectable()
export class CreditsCommand implements TwitchCommand {
	invocations = ["!credit", "!credits", "!dedication"];

	handler = async (
		client: Client,
		channel: string,
		tags: ChatUserstate,
		message: string,
	) => {
		if (
			message.toLowerCase() === "!credit" ||
			message.toLowerCase() === "!credits"
		) {
			client.say(channel, "Kiss @ Thomas (GreyCodes)");
		}

		if (message.toLowerCase() === "!dedication") {
			client.say(channel, "For AB by TK");
		}
	};
}
