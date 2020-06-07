import { injectable } from "inversify";

import { Application } from "express";

import { OpenAPI, useSofa } from "sofa-api";
import { schema } from "@src/graphql/schemaLoader";
import * as swaggerUi from "swagger-ui-express";

import { verifyToken } from "@src/util/jwt";

@injectable()
export class OpenAPIDocs {
	applyMiddleware({
		app,
		apiPath,
		docsPath,
	}: {
		app: Application;
		apiPath?: string;
		docsPath?: string;
	}) {
		const openApi = OpenAPI({
			schema,
			info: {
				title: "Title",
				version: "1.0.0",
				contact: {
					name: "",
					email: "",
				},
			},
		});

		app.use(
			apiPath ?? "/api",
			useSofa({
				schema,
				context: async ({ req }) => {
					try {
						let token = "";
						if (req) {
							token = req.headers.authorization.split(
								"Bearer ",
							)[1];
						}

						const user = await verifyToken(token);

						return { user };
					} catch (e) {
						return {};
					}
				},
				onRoute(info) {
					openApi.addRoute(info, {
						basePath: apiPath ?? "/api",
					});
				},
			}),
		);

		const openAPIDocs = openApi.get();
		openAPIDocs.components = {
			...openAPIDocs.components,
			...{
				securitySchemes: {
					jwtAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
			},
		};

		if (!openAPIDocs.security) openAPIDocs.security = [];
		openAPIDocs.security.push({ jwtAuth: [] });

		app.get((docsPath ?? "/docs") + "/swagger", (req, res) =>
			res.send(JSON.stringify(openAPIDocs)),
		);

		app.use(
			docsPath ?? "/docs",
			swaggerUi.serve,
			swaggerUi.setup(openAPIDocs, { isExplorer: true }),
		);
	}
}
