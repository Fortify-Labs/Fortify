import { injectable } from "inversify";
import { SecretsManager } from "@shared/services/secrets";

@injectable()
export class Secrets extends SecretsManager {
	requestedSecrets = {
		jwt: {
			path: "/jwt",
			fields: ["jwt"],
		},
	};
}
