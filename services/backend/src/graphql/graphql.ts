import { ApolloServer, ApolloError } from "apollo-server-express";
import { injectable } from "inversify";
import { verifyToken } from "../util/jwt";
import { schema } from "./schemaLoader";

import * as Sentry from "@sentry/node";
import { Transaction } from "@sentry/types";
import { Context } from "@shared/services/auth";

@injectable()
export class GraphQL {
	server() {
		const server = new ApolloServer({
			// TODO: Change this in the future - Disable tracing in production
			tracing: true,
			playground: true,
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
					//
					if (
						!("authorization" in connectionParams) &&
						!("Authorization" in connectionParams)
					) {
						throw new ApolloError("Missing auth token");
					}

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
									if (
										err instanceof ApolloError
										// || err instanceof GraphQLError
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

										Sentry.captureException(err);
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
			],
		});

		return server;
	}
}
