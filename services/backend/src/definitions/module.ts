import { DocumentNode } from "graphql";
import { Resolvers } from "./graphql/types";

export interface GQLModule {
	typeDef: DocumentNode;

	resolver: () => Resolvers;
}
