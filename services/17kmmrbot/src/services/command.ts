import { injectable, inject } from "inversify";

import { EachMessagePayload } from "kafkajs";
import { Client } from "tmi.js";

import { FortifyEvent } from "@shared/events/events";
import {
	SystemEventType,
	TwitchLinkedEvent,
	TwitchMessageBroadcastEvent,
} from "@shared/events/systemEvents";
import { PostgresConnector } from "@shared/connectors/postgres";
import { convertMS } from "../lib/dateUtils";
import { Gauge, Summary } from "prom-client";
import { MetricsService, servicePrefix } from "@shared/services/metrics";
import { Logger } from "@shared/logger";

const { BOT_BROADCAST_DISABLED } = process.env;

@injectable()
export class BotCommandProcessor {
	kafkaMessageSummary: Summary<"type" | "status">;

	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(MetricsService) private metrics: MetricsService,
		@inject(Logger) private logger: Logger,
	) {
		this.kafkaMessageSummary = new Summary({
			name: `${servicePrefix}_processed_messages`,
			help: "Summary of duration & outcomes of processed kafka messages",
			registers: [this.metrics.register],
			labelNames: ["type", "status"],
			maxAgeSeconds: 600,
			ageBuckets: 5,
		});
	}

	async process(payload: EachMessagePayload, client: Client) {
		const message: FortifyEvent<SystemEventType> = JSON.parse(
			(payload.message.value ?? "{}").toString(),
		);

		const end = this.kafkaMessageSummary
			.labels({ type: message.type })
			.startTimer();

		if (message.type === SystemEventType.TWITCH_LINKED) {
			const event = TwitchLinkedEvent.deserialize(message);

			this.logger.info("Joining twitch channel", {
				twitchName: event.twitchName,
			});

			await client.join(event.twitchName);

			end({ status: 200 });
			const channelsGauge = this.metrics.register.getSingleMetric(
				`${servicePrefix}_channels`,
			);
			if (channelsGauge) {
				(channelsGauge as Gauge<string>).inc();
			}
		} else if (message.type === SystemEventType.TWITCH_UNLINKED) {
			const event = TwitchLinkedEvent.deserialize(message);

			this.logger.info("Leaving twitch channel", {
				twitchName: event.twitchName,
			});

			await client.part(event.twitchName);

			end({ status: 200 });
			const channelsGauge = this.metrics.register.getSingleMetric(
				`${servicePrefix}_channels`,
			);
			if (channelsGauge) {
				(channelsGauge as Gauge<string>).dec();
			}
		} else if (message.type === SystemEventType.TWITCH_MESSAGE_BROADCAST) {
			const event = TwitchMessageBroadcastEvent.deserialize(message);

			const userRepo = await this.postgres.getUserRepo();
			const channels = await (
				await userRepo.find({ select: ["twitchName"] })
			)
				.map((channel) => channel.twitchName ?? "")
				.filter((value) => value);

			for (const channel of channels) {
				if (BOT_BROADCAST_DISABLED !== "true") {
					if (event.message.startsWith("!date")) {
						const dateString = event.message.replace("!date ", "");

						const goalDate = new Date(dateString);
						const now = new Date();

						const diff = goalDate.getTime() - now.getTime();
						const converted = convertMS(diff);

						await client.say(
							channel,
							`${converted.day * 24 + converted.hour}:${
								converted.minute < 10
									? "0" + converted.minute
									: converted.minute
							}:${
								converted.seconds < 10
									? "0" + converted.seconds
									: converted.seconds
							}`,
						);
					} else {
						await client.say(channel, event.message);
					}
				}
				await sleep(2000);
			}

			end({ status: 200 });
		} else {
			end({ status: 404 });
		}
	}
}

const sleep = (ms: number) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
