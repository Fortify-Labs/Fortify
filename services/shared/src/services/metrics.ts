import { inject, injectable } from "inversify";

import { Server } from "http";
import express from "express";

import promClient, {
	collectDefaultMetrics,
	Gauge,
	Registry,
} from "prom-client";
export { promClient };

import { Logger } from "../logger";

const { npm_package_name = "", npm_package_version = "" } = process.env;
const name = npm_package_name.replace("-", "_"),
	version = npm_package_version;

const servicePrefix = `fortify_${name}`;

export { servicePrefix };

@injectable()
export class MetricsService {
	register: Registry;
	app?: express.Application;
	server?: Server;

	constructor(@inject(Logger) public logger: Logger) {
		this.register = new Registry();

		collectDefaultMetrics({
			register: this.register,
			// prefix: `fortify_${name}_`,
		});

		new Gauge({
			name: `fortify_${name}_version_info`,
			help: `Version info for ${name} service.`,
			labelNames: ["version"],
			registers: [this.register],
			aggregator: "first",
			collect() {
				this.labels(version ?? "0.0.0").set(1);
			},
		});

		process.on("SIGTERM", () =>
			this.shutdown().catch((e) => {
				this.logger.error(
					"An error occurred during SIGTERM shutdown in metrics endpoint",
					{ e },
				);
				this.logger.error(e);
			}),
		);
		process.on("SIGINT", () =>
			this.shutdown().catch((e) => {
				this.logger.error(
					"An error occurred during SIGINT shutdown in metrics endpoint",
					{ e },
				);
				this.logger.error(e);
			}),
		);
	}

	async start() {
		return new Promise<void>((resolve) => {
			this.app = express();

			this.app.get("/metrics", async (req, res) => {
				try {
					res.set("Content-Type", this.register.contentType);
					res.end(await this.register.metrics());
				} catch (ex) {
					res.status(500).end(ex);
				}
			});

			this.server = this.app.listen(
				process.env.KUBERNETES_SERVICE_HOST
					? 8000
					: process.env.LOCAL_METRICS_PORT
					? parseInt(process.env.LOCAL_METRICS_PORT)
					: undefined,
				() => {
					const address = this.server?.address();

					if (address instanceof String) {
						this.logger.info(
							`🚀  Metrics Server ready at ${address}`,
						);
					} else if (address instanceof Object) {
						this.logger.info(
							`🚀  Metrics Server ready at ${address.family}://${address.address}:${address.port}`,
						);
					}

					resolve();
				},
			);
		});
	}

	async shutdown() {
		return new Promise<void>((resolve, reject) => {
			this.server?.close((e) => {
				if (e) {
					this.logger.error(
						"An error occurred while shutting down metrics endpoint",
						{ e },
					);
					reject(e);
				} else {
					this.logger.info(
						"Successful shut down of metrics endpoint",
					);
					resolve();
				}
			});
		});
	}
}
