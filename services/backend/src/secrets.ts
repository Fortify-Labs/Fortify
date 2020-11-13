import { injectable } from "inversify";
import { SecretsManager } from "@shared/services/secrets";

@injectable()
export class Secrets extends SecretsManager {
	requestedSecrets = {
		jwt: {
			path: "/jwt",
			fields: ["jwt"],
		},
		twitchOauth: {
			path: "/twitch-oauth",
			fields: ["clientID", "secret"],
		},
		steamWebApi: {
			path: "/steam-web-api",
			fields: ["apiKey"],
		},
		influxdb: {
			path: "/influxdb",
			fields: ["historizationToken"],
		},
		postgres: {
			path: "/postgres",
			fields: ["password"],
		},
	};
}
