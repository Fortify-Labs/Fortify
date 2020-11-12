import { VaultConnector } from "@shared/connectors/vault";
import debug from "debug";
import { container } from "inversify.config";
import { verify } from "jsonwebtoken";

export const verifyToken = async (token: string) => {
	try {
		const vault = container.get(VaultConnector);
		const jwt = await vault.read("/jwt");

		return new Promise<string | Record<string, unknown>>(
			(resolve, reject) => {
				verify(token, jwt.data.data.jwt ?? "", (error, decoded) => {
					if (error) {
						return reject(error);
					} else {
						if (decoded) {
							return resolve(decoded as Record<string, unknown>);
						} else {
							return resolve(decoded);
						}
					}
				});
			},
		);
	} catch (e) {
		debug("app::util::verifyToken")(e);
		return Promise.reject(e);
	}
};
