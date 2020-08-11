import { ApolloServer, ApolloError } from "apollo-server-express";
import { injectable } from "inversify";
import { verifyToken } from "../util/jwt";
import { schema } from "./schemaLoader";

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
		});

		return server;
	}
}
