import { injectable } from "inversify";
import Redis from "ioredis";
import { HealthCheckable } from "src/services/healthCheck";

const {
	// Single node configs
	REDIS_URL,
	// Sentinel configs

	// REDIS_SENTINEL format will be: "host1:port1;host2:port2;host3:port3"
	REDIS_SENTINEL,
	REDIS_SENTINEL_NAME = "mymaster",
} = process.env;

@injectable()
export class RedisConnector implements HealthCheckable {
	client: Redis.Redis;

	name = "Redis";
	healthCheck: () => Promise<boolean>;

	constructor() {
		this.client = this.createClient();

		this.healthCheck = async () =>
			this.client.status === "ready" &&
			(await this.client.ping()) === "PONG";
	}

	createClient() {
		if (REDIS_SENTINEL) {
			// The filter is used to remove empty string
			const hosts = REDIS_SENTINEL.split(";").filter((entry) => entry);

			return new Redis({
				sentinels: hosts
					.map((host) => host.split(":"))
					.map((host) => {
						return {
							host: host[0],
							port: parseInt(host[1]),
						};
					}),
				name: REDIS_SENTINEL_NAME,
				reconnectOnError: () => true,
				enableReadyCheck: true,
			});
		} else {
			return new Redis(REDIS_URL, {
				reconnectOnError: () => true,
				enableReadyCheck: true,
			});
		}
	}

	async getAsync(key: string) {
		return this.client.get(key);
	}

	async setAsync(key: string, value: string) {
		return this.client.set(key, value);
	}

	async publishAsync(key: string, value: string) {
		return this.client.publish(key, value);
	}

	async expireAsync(key: string, time: number) {
		return this.client.expire(key, time);
	}
}
