import { captureException } from "@sentry/node";
import { ChatUserstate } from "tmi.js";

export const captureTwitchException = (
	e: Error,
	channel: string,
	tags: ChatUserstate,
	message: string,
) => {
	return captureException(e, {
		contexts: {
			channel: {
				name: channel,
			},
			tags,
		},
		user: {
			username: tags["display-name"] || tags.username,
			id: tags["user-id"],
		},
		extra: { message },
	});
};
