import { inject, injectable } from "inversify";

import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { VaultConnector } from "./vault";

const {
	SERVICE_NAME = "unknown",

	INFLUXDB_ORG = "fortify",
	INFLUXDB_BUCKET = "fortify",
	INFLUXDB_URL = "http://localhost:9999",
} = process.env;

@injectable()
export class InfluxDBConnector {
	client: Promise<InfluxDB>;

	constructor(@inject(VaultConnector) private vault: VaultConnector) {
		this.client = this.newClient();
	}

	private async newClient() {
		const influxdb = await this.vault.read("/influxdb");
		const token = influxdb.data.data["historization-token"];

		return new InfluxDB({
			url: INFLUXDB_URL,
			token,
		});
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
