import * as dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config());

import { sharedSetup } from "@shared/index";
global.__rootdir__ = __dirname || process.cwd();
sharedSetup();
import { captureException } from "@sentry/node";

import { container } from "./inversify.config";
import { GraphQL } from "./graphql/graphql";
import debug from "debug";

import { OpenAPIDocs } from "./services/openapidocs";
import { SteamAuthMiddleware } from "./services/steamAuth";
import { TwitchAuthMiddleware } from "./services/twitchAuth";

import express from "express";
import * as bodyParser from "body-parser";
import { Secrets } from "./secrets";

(async () => {
	const secretsManager = container.get(Secrets);
	await secretsManager.getSecrets();

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
		const errorID = captureException(e);
		debug("app::index::steamAuth::applyMiddleware")(errorID);
		debug("app::index::steamAuth::applyMiddleware")(e);
	});

	const twitchAuthMiddleware = container.get(TwitchAuthMiddleware);
	twitchAuthMiddleware.applyMiddleware({ app }).catch((e) => {
		const errorID = captureException(e);
		debug("app::index::twitchAuth::applyMiddleware")(errorID);
		debug("app::index::twitchAuth::applyMiddleware")(e);
	});

	const server = app.listen(
		{ port: parseInt(process.env.MY_PORT ?? "8080", 10) },
		() => {
			graphQLServer.installSubscriptionHandlers(server);

			const address = server.address();

			if (address instanceof Object) {
				debug("app::index")(
					`🚀  Server ready at http://localhost:${address.port}${graphQLServer.graphqlPath}`,
				);
			}

			if (address instanceof String) {
				debug("app::index")(`🚀  Server ready at ${address}`);
			}

			if (!address) {
				debug("app::index")("🚀  Server ready");
			}
		},
	);
})().catch((reason) => {
	const sentryID = captureException(reason);
	debug("app::index::catch")(sentryID);
	debug("app::index::catch")(reason);
	// eslint-disable-next-line no-process-exit
	process.exit(-1);
});
