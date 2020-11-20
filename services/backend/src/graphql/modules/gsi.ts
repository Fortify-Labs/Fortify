import { GQLModule } from "definitions/module";
import { gql } from "apollo-server-express";
import { inject, injectable } from "inversify";
import { Resolvers } from "definitions/graphql/types";
import { PermissionScope } from "@shared/definitions/context";
import { AuthService } from "@shared/services/auth";

@injectable()
export class GSIModule implements GQLModule {
	constructor(@inject(AuthService) private auth: AuthService) {}

	typeDef = gql`
		extend type Mutation {
			generateGsiJwt(id: ID): String! @auth(requires: USER)
		}
	`;

	resolver(): Resolvers {
		const { auth } = this;

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

					return auth.generateJWT({
						user: { id },
						scopes: [PermissionScope.GsiIngress],
					});
				},
			},
		};
	}
}
