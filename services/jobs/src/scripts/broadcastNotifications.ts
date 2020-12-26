import { injectable, inject } from "inversify";

import { captureMessage } from "@sentry/node";

import { FortifyScript } from "../scripts";
import { EventService } from "@shared/services/eventService";
import { TwitchMessageBroadcastEvent } from "@shared/events/systemEvents";
import { Logging } from "@shared/logging";
import winston from "winston";

const { MESSAGE } = process.env;

@injectable()
export class BroadcastNotificationScript implements FortifyScript {
	name = "BroadcastNotificationScript";
	logger: winston.Logger;

	constructor(
		@inject(EventService) private eventService: EventService,
		@inject(Logging) private logging: Logging,
	) {
		this.logger = logging.createLogger();
	}

	async handler() {
		if (MESSAGE) {
			const broadcast = new TwitchMessageBroadcastEvent(MESSAGE);

			await this.eventService.sendEvent(broadcast);
			const messageID = captureMessage(
				"TwitchMessageBroadcastEvent sent",
				{
					extra: {
						message: broadcast.message,
					},
				},
			);
			this.logger.info("TwitchMessageBroadcastEvent sent", { messageID });
		}
	}
}
