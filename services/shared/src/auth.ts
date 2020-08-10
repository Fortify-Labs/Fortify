import { verify, sign, SignOptions } from "jsonwebtoken";

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

const { JWT_SECRET = "" } = process.env;

export const verifyJWT = (token: string, scopes?: PermissionScope[]) => {
	return new Promise<Context & { success: boolean }>((resolve, reject) => {
		verify(token, JWT_SECRET, {}, (err, decoded) => {
			if (err) {
				return reject(err);
			}

			if (decoded) {
				const context = decoded as Context;

				const hasPermissionScope =
					scopes?.reduce(
						(acc, scope) => acc || context?.scopes?.includes(scope),
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
	});
};

export const generateJWT = (payload: Context, options?: SignOptions) => {
	return new Promise<string>((resolve, reject) => {
		sign(payload, JWT_SECRET, options ?? {}, (err, token) => {
			if (err) {
				return reject(err);
			}

			if (token) {
				return resolve(token);
			}
		});
	});
};
