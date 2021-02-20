import { injectable, inject } from "inversify";
import fetch from "node-fetch";

import { FortifyScript } from "../scripts";

import {
	ULLeaderboard,
	LeaderboardType,
} from "@shared/definitions/leaderboard";
import { RedisConnector } from "@shared/connectors/redis";
import { EventService } from "@shared/services/eventService";
import { Logger } from "@shared/logger";

import { ImportCompletedEvent } from "@shared/events/systemEvents";
import { Gauge, Pushgateway, Registry } from "prom-client";
import { servicePrefix } from "@shared/services/metrics";

const { LEADERBOARD_TYPE = "standard", PROMETHEUS_PUSH_GATEWAY } = process.env;

@injectable()
export class LeaderboardImportService implements FortifyScript {
	name = "LeaderboardImportService";
	register: Registry;

	constructor(
		@inject(RedisConnector) private redis: RedisConnector,
		@inject(EventService) private eventService: EventService,
		@inject(Logger) private logger: Logger,
	) {
		this.register = new Registry();
	}

	async handler() {
		const type = LEADERBOARD_TYPE;

		const gauge = new Gauge({
			name: `${servicePrefix}_imports`,
			help: "Gauge tracking duration of imports",
			labelNames: ["type"],
			registers: [this.register],
		});
		const importCountGauge = new Gauge({
			name: `${servicePrefix}_leaderboard_entries`,
			help: "Gauge tracking amount of leaderboard entries",
			labelNames: ["type"],
			registers: [this.register],
		});
		this.register.registerMetric(gauge);
		this.register.registerMetric(importCountGauge);

		const end = gauge.startTimer();

		const leaderboard: ULLeaderboard = await fetch(
			"https://underlords.com/leaderboarddata?type=" + type,
		).then((value) => value.json());

		if ((leaderboard as unknown) === "RequestFailure") {
			this.logger.error(
				`RequestFailure! Could not fetch ${type} leaderboard.`,
			);
			throw new Error(
				`Leaderboard Import: RequestFailure! Could not fetch ${type} leaderboard.`,
			);
		}

		if (!leaderboard.success) {
			this.logger.error(
				`Unsuccessful response! Success boolean in response is false for ${type} leaderboard.`,
			);
			throw new Error(
				`Unsuccessful response! Success boolean in response is false for ${type} leaderboard.`,
			);
		}

		this.logger.info(`${type} leaderboard fetched`);

		await this.redis.setAsync(
			"ul:leaderboard:" + type.toLowerCase(),
			JSON.stringify(leaderboard),
		);

		this.logger.info(`${type} leaderboard stored to redis`);

		const mappedType = type as LeaderboardType;
		if (Object.values(LeaderboardType).includes(mappedType)) {
			const finishedEvent = new ImportCompletedEvent(mappedType, {
				leaderboard,
			});
			await this.eventService.sendEvent(finishedEvent);

			this.logger.info(`Sent ImportCompletedEvent for ${type}`);
		}

		end();
		importCountGauge.labels({ type }).set(leaderboard.leaderboard.length);

		if (PROMETHEUS_PUSH_GATEWAY) {
			const gateway = new Pushgateway(
				PROMETHEUS_PUSH_GATEWAY,
				[],
				this.register,
			);

			new Gauge({
				name: "fortify_jobs_version_info",
				help: "Version info for jobs service.",
				labelNames: ["version"],
				registers: [this.register],
				aggregator: "first",
				collect() {
					this.labels(process.env.npm_package_version ?? "0.0.0").set(
						1,
					);
				},
			});

			await new Promise<void>((resolve, reject) => {
				gateway.push(
					{ jobName: `fortify_import_${type}` },
					(err, res, body) => {
						if (err) {
							this.logger.error(
								"An error occurred while pushing metrics",
								{ e: err },
							);
							this.logger.error(err);
							return reject(err);
						}

						this.logger.info("Push gateway response", {
							body,
							statusCode: res.statusCode,
						});
						resolve();
					},
				);
			});
		}
	}
}
