import { ChatUserstate, Client } from "tmi.js";

export interface TwitchCommand {
	invocations: string[];
	description?: string;
	showInHelp?: boolean;

	authorized?: (
		channel: string,
		tags: ChatUserstate,
		message: string,
	) => Promise<boolean>;

	// Wether a command is currently on timeout or not
	timeout?: (
		channel: string,
		tags: ChatUserstate,
		message: string,
	) => Promise<boolean>;

	handler: (
		client: Client,
		channel: string,
		tags: ChatUserstate,
		message: string,
	) => Promise<unknown>;
}
