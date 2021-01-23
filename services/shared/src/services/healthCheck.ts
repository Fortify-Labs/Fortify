import { inject, injectable, multiInject, optional } from "inversify";

import { createServer, Server } from "http";
import {
	createTerminus,
	HealthCheckError,
	TerminusOptions,
} from "@godaddy/terminus";
import { Logger } from "../logger";

export interface HealthCheckable {
	name: string;
	setupHealthCheck: () => Promise<unknown>;
	healthCheck: () => Promise<boolean>;
	shutdown: () => Promise<unknown>;
}

@injectable()
export class HealthCheck {
	live = false;

	server?: Server;

	constructor(
		@multiInject("healthCheck")
		@optional()
		private healthChecks: HealthCheckable[] = [],
		@inject(Logger) public logger: Logger,
	) {}

	addHealthCheck(healthCheck: HealthCheckable) {
		this.healthChecks.push(healthCheck);
	}

	removeHealthCheck(name: string) {
		this.healthChecks = this.healthChecks.filter(
			(entry) => entry.name !== name,
		);
	}

	async start(options?: TerminusOptions) {
		await Promise.all(
			this.healthChecks.map((check) => check.setupHealthCheck()),
		);

		return new Promise<void>((resolve) => {
			this.server = createServer((req, res) => {
				res.statusCode = 404;
				res.end("404 NOT FOUND");
			});

			options = {
				healthChecks: {
					"/live": async () => this.live,
					"/startup": async () => this.live,
					"/ready": async () => {
						const errors: unknown[] = [];
						const checks = await Promise.all(
							this.healthChecks.map((check) =>
								check.healthCheck().catch((error) => {
									errors.push(error);
									return false;
								}),
							),
						);

						if (errors.length) {
							throw new HealthCheckError(
								"Health check failed",
								errors,
							);
						}

						return checks.every((check) => check);
					},
				},
				logger: (msg, err) =>
					err
						? this.logger.error(msg, { err }) &&
						  this.logger.error(err)
						: this.logger.info(msg),
				...options,
			};

			createTerminus(this.server, options);

			this.server.listen(
				process.env.KUBERNETES_SERVICE_HOST
					? 9000
					: process.env.LOCAL_HEALTH_CHECKS
					? parseInt(process.env.LOCAL_HEALTH_CHECKS)
					: undefined,
				() => {
					const address = this.server?.address();

					if (address instanceof String) {
						this.logger.info(
							`🚀  Health Check Server ready at ${address}`,
						);
					} else if (address instanceof Object) {
						this.logger.info(
							`🚀  Health Check Server ready at ${address.family}://${address.address}:${address.port}`,
						);
					}

					resolve();
				},
			);

			process.on("SIGTERM", () =>
				this.shutdown().catch((e) => {
					this.logger.error(
						"An error occurred during SIGTERM shutdown in health check service",
						{ e },
					);
					this.logger.error(e);
				}),
			);
			process.on("SIGINT", () =>
				this.shutdown().catch((e) => {
					this.logger.error(
						"An error occurred during SIGINT shutdown in health check service",
						{ e },
					);
					this.logger.error(e);
				}),
			);
		});
	}

	async shutdown() {
		return Promise.all(this.healthChecks.map((entry) => entry.shutdown()));
	}
}
