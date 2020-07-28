import { injectable } from "inversify";

import { GQLModule } from "definitions/module";
import { Resolvers } from "definitions/graphql/types";

import { gql } from "apollo-server-express";

@injectable()
export class PoolModule implements GQLModule {
	typeDef = gql`
		extend type Query {
			pool: String
		}
	`;

	resolver(): Resolvers {
		const self = this;

		return {
			Query: {
				async pool() {
					return "";
				},
			},
		};
	}
}
