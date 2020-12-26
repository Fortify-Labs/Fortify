import { inject, injectable } from "inversify";

import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { HealthAPI } from "@influxdata/influxdb-client-apis";
import { SecretsManager, SecretsRequest } from "../services/secrets";
import { HealthCheckable } from "../services/healthCheck";
import { Logging } from "../logging";
import winston from "winston";
import { Connector } from "../definitions/connector";

const {
	SERVICE_NAME = "unknown",

	INFLUXDB_ORG = "fortify",
	INFLUXDB_BUCKET = "fortify",
	INFLUXDB_URL = "http://localhost:9999",
} = process.env;

type InfluxDBSecret = {
	influxdb: {
		historizationToken: string | undefined;
	};
};

@injectable()
export class InfluxDBSecretsRequest implements SecretsRequest {
	requestedSecrets = {
		influxdb: {
			historizationToken: "",
		},
	} as InfluxDBSecret;
}

@injectable()
export class InfluxDBConnector implements HealthCheckable, Connector {
	name = "Influxdb";
	healthCheck: () => Promise<boolean>;
	shutdown = async () => {};

	private _client?: InfluxDB;
	healthAPI?: HealthAPI;
	logger: winston.Logger;

	constructor(
		@inject(SecretsManager)
		private secretsManager: SecretsManager<InfluxDBSecret>,
		@inject(Logging) private logging: Logging,
	) {
		this.logger = logging.createLogger();

		// Set it to false by default
		this.healthCheck = async () => false;
	}

	public async connect() {
		const {
			influxdb: { historizationToken },
		} = await this.secretsManager.getSecrets();

		const influx = new InfluxDB({
			url: INFLUXDB_URL,
			token: historizationToken,
		});

		this._client = influx;

		return influx;
	}

	get client(): InfluxDB {
		if (!this._client) {
			throw new Error("Not connected to influxdb");
		}

		return this._client;
	}

	public async setupHealthCheck() {
		this.healthAPI = new HealthAPI(this.client);

		this.healthCheck = async () =>
			(await this.healthAPI?.getHealth())?.status === "pass";
	}

	async writePoints(points: Point[]) {
		const writeApi = this.client.getWriteApi(INFLUXDB_ORG, INFLUXDB_BUCKET);

		// Not sure about this, potentially make it dynamic
		writeApi.useDefaultTags({ service: SERVICE_NAME });

		writeApi.writePoints(points);

		return writeApi.close();
	}

	async queryApi() {
		return this.client.getQueryApi(INFLUXDB_ORG);
	}
}
