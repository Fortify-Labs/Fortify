import { injectable, multiInject } from "inversify";

import { createServer } from "http";
import {
	createTerminus,
	HealthCheckError,
	TerminusOptions,
} from "@godaddy/terminus";
import debug from "debug";

export interface HealthCheckable {
	name: string;
	healthCheck: () => Promise<boolean>;
}

@injectable()
export class HealthCheck {
	live = false;

	healthChecks: HealthCheckable[];

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
		const server = createServer((req, res) => {
			res.statusCode = 404;
			res.end("404 NOT FOUND");
		});

		options = {
			healthChecks: {
				"/liveness": async () => this.live,
				"/startup": async () => this.live,
				"/readiness": async () => {
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

		createTerminus(server, options);
		server.listen(
			process.env.KUBERNETES_SERVICE_HOST
				? 9000
				: process.env.LOCAL_HEALTH_CHECKS
				? parseInt(process.env.LOCAL_HEALTH_CHECKS)
				: undefined,
			() => {
				const address = server.address();

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
}
