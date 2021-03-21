import { Gauge, Pushgateway, Registry } from "prom-client";
import { Logger } from "@shared/logger";

const { PROMETHEUS_PUSH_GATEWAY } = process.env;

export const pushToPrometheusGateway = async (
	register: Registry,
	logger: Logger,
	jobName = "fortify_jobs",
) => {
	if (PROMETHEUS_PUSH_GATEWAY) {
		const gateway = new Pushgateway(PROMETHEUS_PUSH_GATEWAY, [], register);

		new Gauge({
			name: "fortify_jobs_version_info",
			help: "Version info for jobs service.",
			labelNames: ["version"],
			registers: [register],
			aggregator: "first",
			collect() {
				this.labels(process.env.npm_package_version ?? "0.0.0").set(1);
			},
		});

		await new Promise<void>((resolve, reject) => {
			gateway.push({ jobName }, (err, res, body) => {
				if (err) {
					logger.error("An error occurred while pushing metrics", {
						e: err,
					});
					logger.error(err);
					return reject(err);
				}

				logger.info("Push gateway response", {
					body,
					statusCode: res.statusCode,
				});
				resolve();
			});
		});
	}
};
