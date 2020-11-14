import { inject, injectable } from "inversify";
import { VaultConnector } from "../connectors/vault";

export interface RequestedSecret {
	path: string;
	fields: string[];
}

@injectable()
export class SecretsManager {
	requestedSecrets?: Record<string, RequestedSecret>;
	secrets: Record<string, Record<string, string | undefined>>;

	constructor(@inject(VaultConnector) private vault: VaultConnector) {
		this.secrets = {};
	}

	async getSecrets(override = false) {
		if (
			override ||
			(this.requestedSecrets && !Object.keys(this.secrets).length)
		) {
			for (const name in this.requestedSecrets) {
				const request = this.requestedSecrets[name];

				const secret = await this.vault.read(request.path);

				this.secrets[name] = {};
				for (const field of request.fields) {
					if (!(field in secret.data.data)) {
						throw new Error(
							`Missing field ${field} in secret ${request.path}`,
						);
					}

					this.secrets[name][field] = secret.data.data[field];
				}
			}
		}

		return this.secrets;
	}
}
