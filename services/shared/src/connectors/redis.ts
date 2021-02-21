import { inject, injectable } from "inversify";
import Redis from "ioredis";
import { Connector } from "../definitions/connector";
import { Logger } from "../logger";
import { HealthCheckable } from "../services/healthCheck";

const {
	// Single node configs
	REDIS_URL,

	// Sentinel configs
	// REDIS_SENTINEL format: "host1:port1;host2:port2;host3:port3"
	REDIS_SENTINEL,
	REDIS_SENTINEL_NAME = "mymaster",
} = process.env;

@injectable()
export class RedisConnector implements HealthCheckable, Connector {
	private _client?: Redis.Redis;

	name = "Redis";
	setupHealthCheck = async () => {};
	healthCheck: () => Promise<boolean>;
	shutdown: () => Promise<void>;

	constructor(@inject(Logger) private logger: Logger) {
		this.healthCheck = async () => {
			const result =
				this._client?.status === "ready" &&
				(await this._client.ping()) === "PONG";

			if (!result) {
				this.logger.error("Redis health check failed");
			}

			return result;
		};

		this.shutdown = async () => {
			this._client?.disconnect();
			this._client = undefined;
		};
	}

	async connect() {
		this._client = this.createClient();
		return this._client;
	}

	createClient() {
		let redis: Redis.Redis;

		if (REDIS_SENTINEL) {
			// The filter is used to remove empty string
			const hosts = REDIS_SENTINEL.split(";").filter((entry) => entry);

			redis = new Redis({
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
			redis = new Redis(REDIS_URL, {
				reconnectOnError: () => true,
				enableReadyCheck: true,
			});
		}

		redis.on("error", (e) => {
			this.logger.error("Redis error occurred", { e });
			this.logger.error(e);
		});

		return redis;
	}

	get client(): Redis.Redis {
		if (!this._client) {
			throw new Error("Not connected to redis");
		}

		return this._client;
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
