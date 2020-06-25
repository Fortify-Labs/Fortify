import { ApolloServer } from "apollo-server-express";
import { injectable } from "inversify";
import { verifyToken } from "../util/jwt";
import { schema } from "./schemaLoader";

@injectable()
export class GraphQL {
	server() {
		const server = new ApolloServer({
			tracing: process.env.NODE_ENV !== "production",
			schema,
			async context({ req, connection }) {
				try {
					let token = "";
					if (req) {
						token = req.headers.authorization.split("Bearer ")[1];
					}

					if (connection) {
						token = connection.context.Authorization.split(
							"Bearer ",
						)[1];
					}

					const user = await verifyToken(token);

					return { user };
				} catch (e) {
					return {};
				}
			},
		});

		return server;
	}
}
