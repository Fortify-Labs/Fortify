import { GQLModule } from "../../definitions/module";
import { gql } from "apollo-server-express";
import { injectable } from "inversify";
import { Resolvers } from "../../definitions/graphql/types";

// This module will only be used for debugging purposes and will be removed in the future
@injectable()
export class DebugModule implements GQLModule {
	typeDef = gql`
		extend type Query {
			"Returns the current jwt"
			token: String!
		}
	`;

	resolver(): Resolvers {
		return {
			Query: {
				token(_parent, _args, context) {
					return JSON.stringify(context.user ?? {});
				},
			},
		};
	}
}
