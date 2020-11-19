import { injectable } from "inversify";
import { SecretsManager } from "@shared/services/secrets";

const requestedSecrets = {
	twitchBot: {
		oauthToken: "",
	},
	postgres: {
		password: "",
	},
};

@injectable()
export class Secrets extends SecretsManager<typeof requestedSecrets> {
	requestedSecrets = requestedSecrets;
}
