import { injectable } from "inversify";
import { SecretsManager } from "@shared/services/secrets";

@injectable()
export class Secrets extends SecretsManager {
	requestedSecrets = {
		influxdb: {
			path: "/influxdb",
			fields: ["historizationToken"],
		},
		postgres: {
			path: "/postgres",
			fields: ["password"],
		},
		steamWebApi: {
			path: "/steam-web-api",
			fields: ["apiKey"],
		},
	};
}
