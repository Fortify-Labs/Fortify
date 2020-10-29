import { injectable, inject } from "inversify";
import debug = require("debug");

import { captureMessage } from "@sentry/node";

import { FortifyScript } from "../scripts";
import { EventService } from "@shared/services/eventService";
import { TwitchMessageBroadcastEvent } from "@shared/events/systemEvents";

const { MESSAGE } = process.env;

@injectable()
export class BroadcastNotificationScript implements FortifyScript {
	name = "BroadcastNotificationScript";

	constructor(@inject(EventService) private eventService: EventService) {}

	async handler() {
		if (MESSAGE) {
			const broadcast = new TwitchMessageBroadcastEvent(MESSAGE);

			await this.eventService.sendEvent(broadcast);
			debug("app::BroadcastNotificationScript")(
				"TwitchMessageBroadcastEvent sent",
			);
			const messageID = captureMessage(
				"TwitchMessageBroadcastEvent sent",
				{
					extra: {
						message: broadcast.message,
					},
				},
			);
			debug("app::BroadcastNotificationScript")(messageID);
		}
	}
}
