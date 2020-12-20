import { inject, injectable, multiInject, optional } from "inversify";
import { VaultConnector } from "../connectors/vault";

export interface SecretsRequest {
	requestedSecrets?: Record<string, Record<string, string | undefined>>;
}

@injectable()
export class SecretsManager<
	T extends Record<string, Record<string, string | undefined>>
> {
	requestedSecrets?: T;
	secrets: T;

	constructor(
		@inject(VaultConnector) private vault: VaultConnector,
		@multiInject("secrets")
		@optional()
		private secretsRequests: SecretsRequest[] = [],
	) {
		this.secrets = {} as T;
	}

	async getSecrets(override = false): Promise<T> {
		if (
			override ||
			(this.requestedSecrets && !Object.keys(this.secrets).length)
		) {
			// Enables one to get secrets from connectors injected, without having to specify those directly in the micro services secrets request
			// This also enables one to manage secret requests in the shared lib in one place
			const requestedSecrets = this.secretsRequests.reduce(
				(acc, value) => ({ ...acc, ...value.requestedSecrets }),
				{},
			);
			if (this.requestedSecrets) {
				this.requestedSecrets = {
					...this.requestedSecrets,
					...requestedSecrets,
				};
			} else {
				this.requestedSecrets = requestedSecrets as T;
			}

			for (const path in this.requestedSecrets) {
				const fields = this.requestedSecrets[path];

				const secret = await this.vault.read("/" + path);

				this.secrets[path] = {} as typeof fields;

				for (const field in fields) {
					if (!(field in secret.data.data)) {
						throw new Error(
							`Missing field ${field} in secret ${path}`,
						);
					}

					this.secrets[path][field] = secret.data.data[
						field
					] as typeof fields[typeof field];
				}
			}
		}

		return this.secrets;
	}
}
