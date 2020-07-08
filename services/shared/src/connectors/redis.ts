import { createClient, RedisClient } from "redis";
import { promisify } from "util";

const { REDIS_URL } = process.env;

// TODO: write redis connector
export class RedisConnector {
	client: RedisClient;

	constructor() {
		this.client = createClient({ url: REDIS_URL });
	}

	async getAsync(key: string): Promise<string | null> {
		return promisify(this.client.get).bind(this.client)(key);
	}

	async setAsync(key: string, value: string) {
		return promisify(this.client.set).bind(this.client)(key, value);
	}

	async publishAsync(key: string, value: string) {
		return promisify(this.client.publish).bind(this.client)(key, value);
	}

	async expireAsync(key: string, time: number) {
		return promisify(this.client.expire).bind(this.client)(key, time);
	}
}
