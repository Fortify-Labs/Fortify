import { inject, injectable } from "inversify";
import { VaultConnector } from "../connectors/vault";

@injectable()
export class SecretsManager<
	T extends Record<string, Record<string, string | undefined>>
> {
	requestedSecrets?: T;
	secrets: T;

	constructor(@inject(VaultConnector) private vault: VaultConnector) {
		this.secrets = {} as T;
	}

	async getSecrets(override = false): Promise<T> {
		if (
			override ||
			(this.requestedSecrets && !Object.keys(this.secrets).length)
		) {
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
