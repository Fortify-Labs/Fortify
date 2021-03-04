import { inject, injectable } from "inversify";
import { Logger } from "@shared/logger";
import { FortifyScript } from "../scripts";
import { PostgresConnector } from "@shared/connectors/postgres";
import { User } from "@shared/db/entities/user";
import fetch from "node-fetch";
import { Secrets } from "../secrets";
import { TwitchStreamsResponse } from "../definitions/twitchResponse";
import { Gauge, Registry } from "prom-client";
import { pushToPrometheusGateway } from "../utils/prometheus";
import { servicePrefix } from "@shared/services/metrics";

@injectable()
export class TwitchOnlineScript implements FortifyScript {
	name = "TwitchOnlineScript";
	register: Registry;

	constructor(
		@inject(Logger) private logger: Logger,
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(Secrets) private secrets: Secrets,
	) {
		this.register = new Registry();
	}

	async handler() {
		this.logger.info("Started twitch online updating script");

		const gauge = new Gauge({
			name: `${servicePrefix}_twitch_online_check`,
			help: "Gauge tracking duration of twitch online checks",
			registers: [this.register],
		});
		const end = gauge.startTimer();

		const userRepo = this.postgres.getUserRepo();
		const query = userRepo
			.createQueryBuilder()
			.where('"twitchId" IS NOT NULL');
		const streamers = await query.getMany();

		const streamStatus = await Promise.allSettled(
			streamers.map((streamer) =>
				getStreamStatus(
					streamer,
					this.secrets.secrets.twitchOauth.clientID,
					this.register,
				),
			),
		);

		for (const status of streamStatus) {
			if (status.status === "fulfilled") {
				const { user, res } = status.value;

				if (
					res.stream &&
					res.stream.game.toLowerCase() === "dota underlords"
				) {
					user.twitchLive = true;
				} else {
					user.twitchLive = false;
				}

				await userRepo.save(user);
			}
		}
		end();

		pushToPrometheusGateway(this.register, this.logger);
	}
}

const getStreamStatus = (user: User, clientID: string, register: Registry) => {
	const gauge = new Gauge({
		name: `${servicePrefix}_twitch_api_response_time`,
		help: "Gauge tracking response time of twitch api",
		registers: [register],
	});
	const end = gauge.startTimer();

	return fetch(`https://api.twitch.tv/kraken/streams/${user.twitchId}`, {
		method: "GET",
		headers: {
			Accept: "application/vnd.twitchtv.v5+json",
			"Client-ID": clientID,
		},
	})
		.then((res) => res.json() as Promise<TwitchStreamsResponse>)
		.then((res) => {
			end();

			return { user, res };
		});
};
