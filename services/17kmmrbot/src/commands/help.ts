import { TwitchCommand } from "definitions/twitchCommand";
import { injectable, multiInject } from "inversify";
import { Client, ChatUserstate } from "tmi.js";

@injectable()
export class HelpCommand implements TwitchCommand {
	invocations = ["!help"];
	showInHelp = true;
	description = "List of all available commands";

	constructor(@multiInject("command") private commands: TwitchCommand[]) {}

	handler = async (
		client: Client,
		channel: string,
		tags: ChatUserstate,
		message: string,
	) => {
		const commandName = message.substr(6).trim().toLowerCase();

		const listedCommands = this.commands.filter(
			(command) => command.showInHelp ?? false,
		);

		if (commandName) {
			const command = listedCommands.find(
				(command) =>
					command.invocations.includes(commandName) ||
					command.invocations.includes("!" + commandName),
			);

			if (command) {
				await client.say(
					channel,
					`Command: ${command?.invocations.join(" / ")} - ${
						command?.description
					}`,
				);
			} else {
				await client.say(
					channel,
					`Command "${commandName}" not found!`,
				);
			}
		} else {
			await client.say(
				channel,
				`Available commands are: ${listedCommands
					.map((command) => command.invocations.join(" / "))
					.join(", ")}`,
			);
		}

		return;
	};
}
