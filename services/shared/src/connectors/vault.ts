import { injectable } from "inversify";

import { readFile } from "fs";
import vault from "node-vault";

import { captureException } from "@sentry/node";
import debug from "debug";

// process.env.VAULT_ADDR
// process.env.VAULT_PREFIX
// process.env.VAULT_TOKEN
// process.env.VAULT_NAMESPACE
const {
	K8S_ROLE_NAME,
	K8S_SERVICE_ACCOUNT_TOKEN_PATH,
	VAULT_ENVIRONMENT,
} = process.env;

@injectable()
export class VaultConnector {
	vault: vault.client;

	constructor() {
		this.vault = vault();

		if (K8S_ROLE_NAME && K8S_SERVICE_ACCOUNT_TOKEN_PATH) {
			readFile(K8S_SERVICE_ACCOUNT_TOKEN_PATH, (err, data) => {
				if (err) {
					debug("app::VaultConnector::ReadServiceAccountToken")(err);
					captureException(err);
					return;
				}

				const jwt = data.toString();

				this.vault
					.kubernetesLogin({ role: K8S_ROLE_NAME, jwt })
					.catch((reason) => {
						debug("app::VaultConnector::KubernetesLogin")(reason);
						captureException(reason);
					});
			});
		}
	}

	read(path: string): Promise<VaultRead> {
		return this.vault.read(`/secret/data${VAULT_ENVIRONMENT}${path}`);
	}
}

// --- Definitions ---

export interface VaultRead {
	request_id: string;
	lease_id: string;
	renewable: boolean;
	lease_duration: number;
	data: VaultReadData;
	wrap_info: null;
	warnings: null;
	auth: null;
}

export interface VaultReadData {
	data: Record<string, string | undefined>;
	metadata: Metadata;
}

export interface Metadata {
	created_time: Date;
	deletion_time: string;
	destroyed: boolean;
	version: number;
}
