import { inject, injectable } from "inversify";

import { readFile } from "fs";
import vault from "node-vault";

import { captureException } from "@sentry/node";
import { HealthCheckable } from "src/services/healthCheck";
import { Logger } from "../logger";

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
export class VaultConnector implements HealthCheckable {
	vault: vault.client;

	name = "Vault";
	setupHealthCheck = async () => {};
	healthCheck: () => Promise<boolean>;
	shutdown = async () => {};

	constructor(@inject(Logger) public logger: Logger) {
		this.vault = vault();

		if (K8S_ROLE_NAME && K8S_SERVICE_ACCOUNT_TOKEN_PATH) {
			readFile(K8S_SERVICE_ACCOUNT_TOKEN_PATH, (err, data) => {
				if (err) {
					const exceptionID = captureException(err);
					this.logger.error("Failed to read service account token", {
						err,
						exceptionID,
					});
					return;
				}

				const jwt = data.toString();

				this.vault
					.kubernetesLogin({ role: K8S_ROLE_NAME, jwt })
					.catch((reason) => {
						const exceptionID = captureException(reason);
						this.logger.error("Kubernetes login failed", {
							reason,
							exceptionID,
						});
					});
			});
		}

		this.healthCheck = async () => {
			this.logger.debug("Starting vault health check");

			try {
				const health = (await this.vault.health()) as VaultHealthResponse;

				const status = health.initialized && !health.sealed;

				if (!status) {
					this.logger.error("Vault health check failed");
				}

				this.logger.debug("Finished vault health check");

				return status;
			} catch (e) {
				this.logger.error("Vault health check failed", { e });
				this.logger.error(e);

				this.logger.debug("Finished vault health check");

				return false;
			}
		};
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

export interface VaultHealthResponse {
	cluster_id: string;
	cluster_name: string;
	version: string;
	server_time_utc: number;
	standby: boolean;
	sealed: boolean;
	initialized: boolean;
}
