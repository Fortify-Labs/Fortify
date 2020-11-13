import { config } from "dotenv";
config();

import { sharedSetup } from "@shared/index";
global.__rootdir__ = __dirname || process.cwd();
sharedSetup();

import debug from "debug";
import express from "express";
import { json, urlencoded } from "body-parser";

import { container } from "./inversify.config";
import { KafkaConnector } from "@shared/connectors/kafka";

import { AuthService, PermissionScope } from "@shared/services/auth";

import { captureException, flush } from "@sentry/node";

const { KAFKA_TOPIC, MY_PORT } = process.env;

(async () => {
	const auth = container.get(AuthService);

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
				debug("app::gsi::exception")(e);
				captureException(e, {
					extra: {
						jwtPayload: (req.body.auth as
							| string
							| undefined)?.split(".")[1],
					},
				});
				res.status(500).contentType("text/html").end("SERVER ERROR");
			}
		} else {
			res.status(401).contentType("text/html").end("UNAUTHORIZED");
		}
	});

	app.get("/sentry", async (req, res) => {
		const exception = new Error("Sentry error test");
		const errorID = captureException(exception);
		await flush();
		res.status(200).json({ errorID });
	});

	app.use((req, res) => {
		res.status(404).send("Nothing here");
	});

	const server = app.listen(MY_PORT ?? 4000, () => {
		debug("app::startup")(
			"GSI endpoint listening on port " + (MY_PORT ?? 8080) + "!",
		);
	});

	process.on("SIGTERM", shutDown);
	process.on("SIGINT", shutDown);

	async function shutDown() {
		try {
			await producer.disconnect();
		} finally {
			debug("app::shutdown")(
				"Received kill signal, shutting down gracefully",
			);

			server.close(() => {
				debug("app::shutdown")("Closed out remaining connections");
				// eslint-disable-next-line no-process-exit
				process.exit(0);
			});

			setTimeout(() => {
				debug("app::shutdown")(
					"Could not close connections in time, forcefully shutting down",
				);
				// eslint-disable-next-line no-process-exit
				process.exit(1);
			}, 10000);
		}
	}
})().catch((e) => {
	debug("app::start")(e);
	captureException(e);
});
