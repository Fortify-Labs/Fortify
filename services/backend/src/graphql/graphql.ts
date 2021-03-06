import { ApolloServer, ApolloError } from "apollo-server-express";
import { inject, injectable } from "inversify";
import { verifyToken } from "../util/jwt";
import { schema } from "./schemaLoader";

import * as Sentry from "@sentry/node";
import { Transaction } from "@sentry/types";
import { Context } from "@shared/definitions/context";
import { GraphQLError } from "graphql";
import { MetricsService } from "@shared/services/metrics";
import createMetricsPlugin from "apollo-metrics";

import { ApolloServerPlugin } from "apollo-server-plugin-base";
import { Logger } from "@shared/logger";

const { IGNORE_ERROR_CODES } = process.env;

const ignorableErrorCodes = IGNORE_ERROR_CODES?.split(";");

@injectable()
export class GraphQL {
	constructor(
		@inject(MetricsService) private metrics: MetricsService,
		@inject(Logger) private logger: Logger,
	) {}

	server() {
		const apolloMetricsPlugin = createMetricsPlugin(
			this.metrics.register,
		) as ApolloServerPlugin<Record<string, string>>;

		const { logger } = this;

		const server = new ApolloServer({
			tracing: true,
			playground: true,
			introspection: true,
			schema,
			async context({ req, connection }) {
				try {
					let token = "";
					if (req) {
						const _token = req.headers.authorization?.split(
							"Bearer ",
						)[1];
						token = _token ?? "";
					}

					if (connection) {
						token = (connection.context.authorization
							? connection.context.authorization
							: connection.context.Authorization
							? connection.context.Authorization
							: ""
						).split("Bearer ")[1];
					}

					const user = await verifyToken(token);

					return user;
				} catch (e) {
					return {};
				}
			},
			subscriptions: {
				onConnect: (connectionParams) => {
					// Also allow unauthenticated access

					// if (
					// 	!("authorization" in connectionParams) &&
					// 	!("Authorization" in connectionParams)
					// ) {
					// 	throw new ApolloError("Missing auth token");
					// }

					return connectionParams;
				},
			},
			plugins: [
				{
					requestDidStart() {
						return {
							didEncounterErrors(ctx) {
								if (!ctx.operation) {
									return;
								}

								for (const err of ctx.errors) {
									// Only report internal server errors,
									// all errors extending ApolloError should be user-facing
									if (err instanceof ApolloError) {
										continue;
									}

									if (
										err instanceof GraphQLError &&
										err.extensions &&
										ignorableErrorCodes?.includes(
											err.extensions.code,
										)
									) {
										continue;
									}

									// Add scoped report details and send to Sentry
									Sentry.withScope((scope) => {
										// Annotate whether failing operation was query/mutation/subscription
										scope.setTag(
											"kind",
											ctx.operation?.operation ?? "",
										);

										// Log query and variables as extras (make sure to strip out sensitive data!)
										scope.setExtra(
											"query",
											ctx.request.query,
										);
										scope.setExtra(
											"variables",
											ctx.request.variables,
										);

										const context = ctx.context as Context;
										if (context.user) {
											scope.setUser({
												id: context.user.id,
											});
										}

										if (err.path) {
											// We can also add the path as breadcrumb
											scope.addBreadcrumb({
												category: "query-path",
												message: err.path.join(" > "),
												level: Sentry.Severity.Debug,
											});
										}

										const transactionId = ctx.request.http?.headers.get(
											"x-transaction-id",
										);
										if (transactionId) {
											scope.setTransactionName(
												transactionId,
											);
										}

										if (ctx.context.transaction) {
											scope.setSpan(
												ctx.context.transaction,
											);
										}

										if (
											err instanceof GraphQLError &&
											err.extensions &&
											err.extensions.code ===
												"QUERY_LOBBY_ID"
										) {
											scope.setExtra(
												"extensions",
												JSON.stringify(
													err.extensions,
													null,
													2,
												),
											);
										}

										Sentry.captureException(err);
										logger.debug(err);
									});
								}
							},
							executionDidStart(ctx) {
								const transaction = Sentry.startTransaction({
									name: ctx.operationName ?? "Unnamed query",
									op: ctx.operation.operation,
									data: {
										query: ctx.request.query,
										variables: ctx.request.variables,
									},
								});

								ctx.request.http?.headers.set(
									"x-transaction-id",
									transaction.traceId,
								);

								ctx.context.transaction = transaction;
							},
							async willSendResponse(ctx) {
								const transaction: Transaction =
									ctx.context.transaction;

								transaction.finish();
							},
						};
					},
				},
				apolloMetricsPlugin,
			],
		});

		return server;
	}
}
