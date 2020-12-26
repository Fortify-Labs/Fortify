import { container } from "../inversify.config";
import { verify } from "jsonwebtoken";
import { Secrets } from "../secrets";
import { Logging } from "@shared/logging";

export const verifyToken = async (token: string) => {
	try {
		const {
			jwt: { jwt },
		} = await container.get(Secrets).getSecrets();

		return new Promise<string | Record<string, unknown>>(
			(resolve, reject) => {
				verify(token, jwt ?? "", (error, decoded) => {
					if (error) {
						return reject(error);
					} else {
						if (decoded) {
							return resolve(decoded as Record<string, unknown>);
						} else {
							return reject(new Error("Undefined JWT decoded"));
						}
					}
				});
			},
		);
	} catch (e) {
		const logger = container.get(Logging).createLogger();
		logger.error("An error occurred while verifying JWT", { e });
		logger.error(e);

		return Promise.reject(e);
	}
};
