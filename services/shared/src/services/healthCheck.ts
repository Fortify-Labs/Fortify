import { injectable, multiInject } from "inversify";

import { createServer, Server } from "http";
import {
	createTerminus,
	HealthCheckError,
	TerminusOptions,
} from "@godaddy/terminus";
import debug from "debug";

export interface HealthCheckable {
	name: string;
	healthCheck: () => Promise<boolean>;
	shutdown: () => Promise<unknown>;
}

@injectable()
export class HealthCheck {
	live = false;

	healthChecks: HealthCheckable[];
	server?: Server;

	constructor(
		@multiInject("healthCheck") private services: HealthCheckable[],
	) {
		this.healthChecks = services;
	}

	addHealthCheck(healthCheck: HealthCheckable) {
		this.healthChecks.push(healthCheck);
	}

	removeHealthCheck(name: string) {
		this.healthChecks = this.healthChecks.filter(
			(entry) => entry.name !== name,
		);
	}

	start(options?: TerminusOptions) {
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
							"healthcheck failed",
							errors,
						);
					}

					return checks.every((check) => check);
				},
			},
			logger: debug("app::terminus"),
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
					debug("app::health")(
						`🚀  Health Check Server ready at ${address}`,
					);
				} else if (address instanceof Object) {
					debug("app::health")(
						`🚀  Health Check Server ready at ${address.family}://${address.address}:${address.port}`,
					);
				}
			},
		);
	}

	async shutdown() {
		await Promise.all(this.healthChecks.map((entry) => entry.shutdown()));

		return new Promise<void>((resolve, reject) => {
			this.server?.close((err) => (err ? reject(err) : resolve()));
		});
	}
}