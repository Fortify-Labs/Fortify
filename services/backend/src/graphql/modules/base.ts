import { GQLModule } from "../../definitions/module";
import { gql } from "apollo-server-express";
import { injectable } from "inversify";
import { Resolvers } from "../../definitions/graphql/types";
import { pubSub } from "../pubsub";

// import packageJSON = require("@root/package.json");

@injectable()
export class BaseModule implements GQLModule {
	typeDef = gql`
		type Query {
			"Returns the current package.json version"
			version: String!
		}

		type Mutation {
			"Used as placeholder as empty types aren't currently supported. Also fires and event to the _base_ subscription."
			_base_: String!
		}

		type Subscription {
			"Used as placeholder as empty types aren't currently supported."
			_base_: String! @auth
		}

		"""
		Custom scalar type for date.
		A unix timestamp served as string.
		"""
		scalar Date
	`;

	resolver(): Resolvers {
		return {
			Query: {
				version() {
					// FIXME: Once I'm going to be motivated to touch this again
					// return packageJSON.version || "1.0.0";

					return "1.0.0";
				},
			},
			Mutation: {
				_base_() {
					pubSub.publish("_base_", {
						_base_: "_base_ --- " + new Date().toString(),
					});

					return "_base_";
				},
			},
			Subscription: {
				_base_: {
					subscribe() {
						return pubSub.asyncIterator("_base_");
					},
				},
			},
		};
	}
}
