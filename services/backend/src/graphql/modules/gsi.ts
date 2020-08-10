import { GQLModule } from "definitions/module";
import { gql } from "apollo-server-express";
import { injectable } from "inversify";
import { Resolvers } from "definitions/graphql/types";
import { PermissionScope, generateJWT } from "@shared/auth";

@injectable()
export class GSIModule implements GQLModule {
	typeDef = gql`
		extend type Mutation {
			generateGsiJwt(id: ID): String! @auth(requires: USER)
		}
	`;

	resolver(): Resolvers {
		return {
			Mutation: {
				async generateGsiJwt(parent, args, context) {
					let id = context.user.id;

					if (
						context.scopes.includes(PermissionScope.Admin) &&
						args.id
					) {
						id = args.id;
					}

					return generateJWT({
						user: { id },
						scopes: [PermissionScope.GsiIngress],
					});
				},
			},
		};
	}
}
