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

	client: Promise<InfluxDB>;
	healthAPI?: HealthAPI;

	constructor(
		@inject(SecretsManager) private secretsManager: SecretsManager,
	) {
		// Set it to false by default
		this.healthCheck = async () => false;
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

		this.healthAPI = new HealthAPI(influx);
		this.healthCheck = async () =>
			(await this.healthAPI?.getHealth())?.status === "pass";

		return influx;
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
