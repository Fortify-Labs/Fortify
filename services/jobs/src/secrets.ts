import { injectable } from "inversify";
import { SecretsManager } from "@shared/services/secrets";

const requestedSecrets = {
	postgres: {
		password: "",
	},
	twitchOauth: {
		clientID: "",
	},
};

@injectable()
export class Secrets extends SecretsManager<typeof requestedSecrets> {
	requestedSecrets = requestedSecrets;
}
