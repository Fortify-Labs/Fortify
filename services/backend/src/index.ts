import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config());

import { sharedSetup } from "@shared/index";
sharedSetup();

import { container } from "./inversify.config";
import { GraphQL } from "./graphql/graphql";
import * as debug from "debug";

import { OpenAPIDocs } from "./services/openapidocs";

import * as express from "express";
import * as bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const graphQL = container.get(GraphQL);
const graphQLServer = graphQL.server();
graphQLServer.applyMiddleware({ app, path: "/graphql" });

const openAPI = container.get(OpenAPIDocs);
openAPI.applyMiddleware({ app, apiPath: "/api", docsPath: "/docs" });

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
