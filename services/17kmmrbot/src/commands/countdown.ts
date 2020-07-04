import { injectable } from "inversify";

import { Client, ChatUserstate } from "tmi.js";
import { TwitchCommand } from "../definitions/twitchCommand";

@injectable()
export class CountdownCommand implements TwitchCommand {
	invocations = ["!cd", "!countdown"];

	authorized = async (_channel: string, tags: ChatUserstate) =>
		tags.badges?.broadcaster === "1" ||
		tags["display-name"]?.toLocaleLowerCase() === "greycodes";

	handler = async (client: Client, channel: string) => {
		let seconds = 5;

		const countdown = async () => {
			if (seconds === 0) {
				clearInterval(timer);

				return client.say(channel, "go");
			}

			await client.say(channel, seconds.toString());

			seconds -= 1;

			return;
		};

		const timer = setInterval(countdown, 1000);
	};
}
