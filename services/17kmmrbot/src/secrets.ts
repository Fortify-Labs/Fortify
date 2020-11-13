import { injectable } from "inversify";
import { SecretsManager } from "@shared/services/secrets";

@injectable()
export class Secrets extends SecretsManager {
	requestedSecrets = {
		twitchBot: {
			path: "/twitch-bot",
			fields: ["oauthToken"],
		},
		postgres: {
			path: "/postgres",
			fields: ["password"],
		},
	};
}
