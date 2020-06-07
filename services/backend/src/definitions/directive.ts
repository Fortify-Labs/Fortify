import { DocumentNode } from "graphql";
import { SchemaDirectiveVisitor } from "graphql-tools";

export interface GQLDirective {
	typeDef: DocumentNode;

	schemaVisitor: {
		[key: string]: typeof SchemaDirectiveVisitor;
	};
}
