import { inject, injectable } from "inversify";
import { sign, SignOptions, verify } from "jsonwebtoken";
import { SecretsManager } from "./secrets";

export enum PermissionScope {
	Admin = "ADMIN",
	User = "USER",
	GsiIngress = "GSI_INGRESS",
	Unknown = "UNKNOWN",
}

export interface Context {
	user: {
		id: string;
	};

	scopes: ReadonlyArray<PermissionScope>;
}

@injectable()
export class AuthService {
	constructor(@inject(SecretsManager) private secrets: SecretsManager) {}

	async verifyJWT(token: string, scopes: PermissionScope[]) {
		const {
			jwt: { jwt },
		} = await this.secrets.getSecrets();

		return new Promise<Context & { success: boolean }>(
			(resolve, reject) => {
				verify(token, jwt ?? "", {}, (err, decoded) => {
					if (err) {
						return reject(err);
					}

					if (decoded) {
						const context = decoded as Context;

						const hasPermissionScope =
							scopes?.reduce(
								(acc, scope) =>
									acc || context?.scopes?.includes(scope),
								false,
							) ?? false;

						return resolve({
							...context,
							success: hasPermissionScope,
						});
					} else {
						return reject(new Error("Token Empty"));
					}
				});
			},
		);
	}

	async generateJWT(payload: Context, options?: SignOptions) {
		const {
			jwt: { jwt },
		} = await this.secrets.getSecrets();

		return new Promise<string>((resolve, reject) => {
			sign(payload, jwt ?? "", options ?? {}, (err, token) => {
				if (err) {
					return reject(err);
				}

				if (token) {
					return resolve(token);
				}
			});
		});
	}
}
