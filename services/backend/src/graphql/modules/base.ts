import { injectable, inject } from "inversify";
import { gql } from "apollo-server-express";

import { GQLModule } from "../../definitions/module";
import { Resolvers } from "../../definitions/graphql/types";

import packageJSON = require("../../../package.json");
import { GQLPubSub } from "../pubsub";

@injectable()
export class BaseModule implements GQLModule {
	constructor(@inject(GQLPubSub) public pubSub: GQLPubSub) {}

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
		const { pubSub } = this.pubSub;

		return {
			Query: {
				version() {
					return packageJSON?.version ?? "1.0.0";
				},
			},
			Mutation: {
				async _base_() {
					await pubSub.publish("_base_", {
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
