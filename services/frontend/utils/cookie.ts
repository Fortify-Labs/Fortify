import cookie from "js-cookie";

import { IncomingMessage } from "http";

export const setCookie = (key: string, value: string) => {
	const ssrMode = typeof window === "undefined";

	if (ssrMode) {
		cookie.set(key, value, {
			expires: 1,
			path: "/",
		});
	}
};

export const removeCookie = (key: string, domain?: string) => {
	const ssrMode = typeof window === "undefined";

	// if (ssrMode) {
	cookie.remove(key, {
		expires: 1,
		path: "/",
		domain,
	});
	// }
};

export const getCookie = (key: string, req: any) => {
	const ssrMode = typeof window === "undefined";

	return !ssrMode ? getCookieFromBrowser(key) : getCookieFromServer(key, req);
};

export const getCookieFromBrowser = (key: string) => {
	return cookie.get(key);
};

const getCookieFromServer = (key: string, req?: IncomingMessage) => {
	if (!req?.headers.cookie) {
		return undefined;
	}
	const rawCookie = req.headers.cookie
		.split(";")
		.find((c: any) => c.trim().startsWith(`${key}=`));
	if (!rawCookie) {
		return undefined;
	}
	return rawCookie.split("=")[1];
};
