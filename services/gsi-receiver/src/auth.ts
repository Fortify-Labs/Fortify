import { verify } from "jsonwebtoken";
import { PermissionScope, Context } from "@shared/auth";

export const verifyGSIAuth = (token: string, JWT_SECRET: string) => {
	return new Promise<Context & { success: boolean }>((resolve, reject) => {
		verify(token, JWT_SECRET, {}, (err, decoded) => {
			if (err) {
				return reject(err);
			}

			if (decoded) {
				const context = decoded as Context;

				const hasPermissionScope = context?.scopes?.includes(
					PermissionScope.GsiIngress,
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
