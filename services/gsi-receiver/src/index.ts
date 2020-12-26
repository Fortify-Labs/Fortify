import { config } from "dotenv";
config();

import { sharedSetup } from "@shared/index";
global.__rootdir__ = __dirname || process.cwd();
sharedSetup();

import express from "express";
import { json, urlencoded } from "body-parser";

import { container } from "./inversify.config";
import { KafkaConnector } from "@shared/connectors/kafka";

import { PermissionScope } from "@shared/definitions/context";
import { AuthService } from "@shared/services/auth";

import { captureException, flush } from "@sentry/node";
import { Secrets } from "./secrets";
import { HealthCheck } from "@shared/services/healthCheck";

import { Logging } from "@shared/logging";
import { Connector } from "@shared/definitions/connector";

const { KAFKA_TOPIC, MY_PORT } = process.env;

(async () => {
	const logger = container.get(Logging).createLogger();

	await container.get(Secrets).getSecrets();

	await Promise.all(
		container
			.getAll<Connector>("connector")
			.map((connector) => connector.connect()),
	);

	const auth = container.get(AuthService);

	const healthCheck = container.get(HealthCheck);
	await healthCheck.start();

	const kafka = container.get(KafkaConnector);

	const producer = kafka.producer();
	await producer.connect();

	const app = express();

	app.use(urlencoded({ extended: true, limit: "10mb" }));
	app.use(json({ limit: "10mb" }));

	app.post("/gsi", async (req, res) => {
		// Send an unsuccessful response on failed auth
		if (req.body && req.body.auth) {
			try {
				const { user, success } = await auth.verifyJWT(req.body.auth, [
					PermissionScope.GsiIngress,
				]);

				if (success) {
					res.status(200).contentType("text/html").end("OK");

					req.body.auth = { user };

					req.body.block = req.body.block.filter(
						(block: object) => Object.keys(block).length > 0,
					);

					req.body.timestamp = new Date();

					await producer.send({
						topic: KAFKA_TOPIC ?? "gsi",
						messages: [
							{
								key: `userid-${user.id}`,
								value: JSON.stringify(req.body),
							},
						],
					});
				} else {
					res.status(401)
						.contentType("text/html")
						.end("UNAUTHORIZED");
				}
			} catch (e) {
				const exceptionID = captureException(e, {
					extra: {
						jwtPayload: (req.body.auth as
							| string
							| undefined)?.split(".")[1],
					},
				});
				logger.error("GSI message processing failed", {
					e,
					exceptionID,
				});
				res.status(500)
					.contentType("text/html")
					.end(`SERVER ERROR (${exceptionID})`);
			}
		} else {
			res.status(401).contentType("text/html").end("UNAUTHORIZED");
		}
	});

	app.get("/health", (req, res) => {
		// This can be a simple response and no additional health checks done
		// as we can assume that kubernetes wouldn't route any traffic to this instance
		// in case the pod would become not ready
		res.status(200).json({ success: true });
	});

	app.use((req, res) => {
		res.status(404).send("Nothing here");
	});

	const server = app.listen(MY_PORT ?? 4000, () => {
		logger.info(`GSI endpoint listening on port ${MY_PORT ?? 8080}!`);

		healthCheck.live = true;
	});

	process.on("SIGTERM", shutDown);
	process.on("SIGINT", shutDown);

	async function shutDown() {
		await flush(10000).catch(() => {});

		try {
			server.close(async () => {
				logger.info("Closing remaining connections");
				await producer.disconnect();
				logger.info("Closed remaining connections");
				// eslint-disable-next-line no-process-exit
				process.exit(0);
			});
		} finally {
			logger.info("Received kill signal, shutting down gracefully");

			setTimeout(() => {
				logger.warn(
					"Could not close connections in time, forcefully shutting down",
				);
				// eslint-disable-next-line no-process-exit
				process.exit(1);
			}, 10000);
		}
	}
})().catch((e) => {
	const logger = container.get(Logging).createLogger();

	const exceptionID = captureException(e);

	logger.error(e, { exceptionID });

	flush(10000)
		.catch(() => {})
		// eslint-disable-next-line no-process-exit
		.finally(() => process.exit(-1));
});
