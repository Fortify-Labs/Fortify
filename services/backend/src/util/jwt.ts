import { verify } from "jsonwebtoken";

export const verifyToken = async (token: string) => {
	return new Promise<string | Record<string, unknown>>((resolve, reject) => {
		verify(token, process.env.JWT_SECRET ?? "", (error, decoded) => {
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
	});
};
