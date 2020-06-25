import { makeExecutableSchema, SchemaDirectiveVisitor } from "graphql-tools";
import { GraphQLSchema } from "graphql";
import { container } from "../inversify.config";
import { GQLModule } from "../definitions/module";
import { GQLDirective } from "../definitions/directive";

const modules = container.getAll<GQLModule>("module");
const directives = container.getAll<GQLDirective>("directive");

export const schema: GraphQLSchema = makeExecutableSchema({
	typeDefs: modules
		.map((module) => module.typeDef)
		.concat(directives.map((directive) => directive.typeDef)),

	resolvers: modules.map((module) => module.resolver()),

	schemaDirectives: directives.reduce<{
		[key: string]: typeof SchemaDirectiveVisitor;
	}>(
		(accumulator, directive) =>
			Object.assign(accumulator, directive.schemaVisitor),
		{},
	),
});

// tslint:disable-next-line: no-default-export
export default () => schema;
