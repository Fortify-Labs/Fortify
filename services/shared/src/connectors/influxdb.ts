import { inject, injectable } from "inversify";

import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { HealthAPI } from "@influxdata/influxdb-client-apis";
import { SecretsManager } from "../services/secrets";
import { HealthCheckable } from "../services/healthCheck";

const {
	SERVICE_NAME = "unknown",

	INFLUXDB_ORG = "fortify",
	INFLUXDB_BUCKET = "fortify",
	INFLUXDB_URL = "http://localhost:9999",
} = process.env;

@injectable()
export class InfluxDBConnector implements HealthCheckable {
	name = "Influxdb";
	healthCheck: () => Promise<boolean>;
	shutdown: () => Promise<void>;

	client: Promise<InfluxDB>;
	healthAPI?: HealthAPI;

	constructor(
		@inject(SecretsManager)
		private secretsManager: SecretsManager<{
			influxdb: { historizationToken: string | undefined };
		}>,
	) {
		// Set it to false by default
		this.healthCheck = async () => false;
		this.shutdown = async () => {};
		this.client = this.newClient();
	}

	private async newClient() {
		const {
			influxdb: { historizationToken },
		} = await this.secretsManager.getSecrets();

		const influx = new InfluxDB({
			url: INFLUXDB_URL,
			token: historizationToken,
		});

		return influx;
	}

	public async setupHealthCheck() {
		this.healthAPI = new HealthAPI(await this.client);

		this.healthCheck = async () =>
			(await this.healthAPI?.getHealth())?.status === "pass";
	}

	async writePoints(points: Point[]) {
		const writeApi = (await this.client).getWriteApi(
			INFLUXDB_ORG,
			INFLUXDB_BUCKET,
		);

		// Not sure about this, potentially make it dynamic
		writeApi.useDefaultTags({ service: SERVICE_NAME });

		writeApi.writePoints(points);

		return writeApi.close();
	}

	async queryApi() {
		return (await this.client).getQueryApi(INFLUXDB_ORG);
	}
}
