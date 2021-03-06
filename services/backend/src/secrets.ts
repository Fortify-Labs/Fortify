import { injectable } from "inversify";
import { SecretsManager } from "@shared/services/secrets";

const requestedSecrets = {
	jwt: {
		jwt: "",
	},
	twitchOauth: {
		clientID: "",
		secret: "",
	},
	steamWebApi: {
		apiKey: "",
	},
	postgres: {
		password: "",
	},
};
@injectable()
export class Secrets extends SecretsManager<typeof requestedSecrets> {
	requestedSecrets = requestedSecrets;
}
