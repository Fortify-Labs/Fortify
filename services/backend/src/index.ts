import * as dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config());

import { sharedSetup } from "@shared/index";
global.__rootdir__ = __dirname || process.cwd();
sharedSetup();
import { captureException, flush } from "@sentry/node";

import { container } from "./inversify.config";
import { GraphQL } from "./graphql/graphql";

import { OpenAPIDocs } from "./services/openapidocs";
import { SteamAuthMiddleware } from "./services/steamAuth";
import { TwitchAuthMiddleware } from "./services/twitchAuth";

import express from "express";
import * as bodyParser from "body-parser";
import { Secrets } from "./secrets";
import { HealthCheck } from "@shared/services/healthCheck";
import { Logging } from "@shared/logging";
import { Connector } from "@shared/definitions/connector";

(async () => {
	const logger = container.get(Logging).createLogger();

	const secretsManager = container.get(Secrets);
	await secretsManager.getSecrets();

	await Promise.all(
		container
			.getAll<Connector>("connector")
			.map((connector) => connector.connect()),
	);

	const healthCheck = container.get(HealthCheck);
	await healthCheck.start();

	const app = express();
	app.use(bodyParser.json());

	const graphQL = container.get(GraphQL);
	const graphQLServer = graphQL.server();
	// FIXME: Remove the any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	graphQLServer.applyMiddleware({ app: app as any, path: "/graphql" });

	const openAPI = container.get(OpenAPIDocs);
	openAPI.applyMiddleware({ app, apiPath: "/api", docsPath: "/docs" });

	const authMiddleware = container.get(SteamAuthMiddleware);
	authMiddleware.applyMiddleware({ app }).catch((e) => {
		const exceptionID = captureException(e);
		logger.error("Steam auth middleware apply failed", {
			exceptionID,
			e,
		});
		logger.error(e, {
			exceptionID,
		});

		flush(10000)
			.catch(() => {})
			// eslint-disable-next-line no-process-exit
			.finally(() => process.exit(-1));
	});

	const twitchAuthMiddleware = container.get(TwitchAuthMiddleware);
	twitchAuthMiddleware.applyMiddleware({ app }).catch((e) => {
		const exceptionID = captureException(e);
		logger.error("Twitch auth middleware apply failed", {
			exceptionID,
			e,
		});
		logger.error(e, {
			exceptionID,
		});

		flush(10000)
			.catch(() => {})
			// eslint-disable-next-line no-process-exit
			.finally(() => process.exit(-1));
	});

	const server = app.listen(
		{ port: parseInt(process.env.MY_PORT ?? "8080", 10) },
		() => {
			graphQLServer.installSubscriptionHandlers(server);

			const address = server.address();

			if (address instanceof Object) {
				logger.info(
					`🚀  Server ready at http://localhost:${address.port}${graphQLServer.graphqlPath}`,
				);
			}

			if (address instanceof String) {
				logger.info(`🚀  Server ready at ${address}`);
			}

			if (!address) {
				logger.info("🚀  Server ready");
			}

			healthCheck.live = true;
		},
	);

	process.on("SIGTERM", shutDown);
	process.on("SIGINT", shutDown);

	async function shutDown() {
		await flush(10000).catch(() => {});

		setTimeout(() => {
			logger.warn(
				"Could not close connections in time, forcefully shutting down",
			);
			// eslint-disable-next-line no-process-exit
			process.exit(1);
		}, 10000);

		try {
			server.close(async () => {
				logger.info("Received kill signal, shutting down gracefully");
				// eslint-disable-next-line no-process-exit
				process.exit(0);
			});
		} finally {
			logger.info("Received kill signal, finally shutting down");
		}
	}
})().catch((e) => {
	const exceptionID = captureException(e);

	const logger = container.get(Logging).createLogger();

	logger.error("An error occurred in the main context", {
		exceptionID,
		e,
	});

	logger.error(e, {
		exceptionID,
	});

	flush(10000)
		.catch(() => {})
		// eslint-disable-next-line no-process-exit
		.finally(() => process.exit(-1));
});
