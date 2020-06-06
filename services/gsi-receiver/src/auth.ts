import { verify } from "jsonwebtoken";
import { Context, Scope } from "./types";

export const verifyGSIAuth = (token: string, JWT_SECRET: string) => {
	return new Promise<Context & { success: boolean }>((resolve, reject) => {
		verify(token, JWT_SECRET, {}, (err, decoded) => {
			if (err) {
				return reject(err);
			}

			if (decoded) {
				const context = decoded as Context;

				const hasPermissionScope = context?.scopes?.includes(
					Scope.GSI_INGRESS,
				);

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
