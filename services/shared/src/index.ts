import "reflect-metadata";
import debug = require("debug");

import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";

const { SENTRY_DSN } = process.env;

export const sharedSetup = (
	name = process.env.npm_package_name,
	release = process.env.npm_package_version,
) => {
	debug("app::sharedSetup")(`Launching ${name} v${release}`);

	Sentry.init({
		dsn: SENTRY_DSN,
		release,
		integrations: [
			new RewriteFrames({
				root: global.__rootdir__,
			}),
		],
	});
};

// --- Sentry related code to rewrite frames ---

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		interface Global {
			__rootdir__: string;
		}
	}
}

global.__rootdir__ = __dirname || process.cwd();
