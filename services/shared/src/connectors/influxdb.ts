import { injectable } from "inversify";

import { InfluxDB, Point } from "@influxdata/influxdb-client";

const {
	SERVICE_NAME = "unknown",

	INFLUXDB_TOKEN,
	INFLUXDB_ORG = "fortify",
	INFLUXDB_BUCKET = "fortify",
	INFLUXDB_URL = "http://localhost:9999",
} = process.env;

@injectable()
export class InfluxDBConnector {
	client: InfluxDB;

	constructor() {
		this.client = new InfluxDB({
			url: INFLUXDB_URL,
			token: INFLUXDB_TOKEN,
		});
	}

	writePoints(points: Point[]) {
		const writeApi = this.client.getWriteApi(INFLUXDB_ORG, INFLUXDB_BUCKET);

		// Not sure about this, potentially make it dynamic
		writeApi.useDefaultTags({ service: SERVICE_NAME });

		writeApi.writePoints(points);

		return writeApi.close();
	}
}
