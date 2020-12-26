import "reflect-metadata";

import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";
import { Logging } from "./logging";

const { SENTRY_DSN } = process.env;

export const sharedSetup = (
	name = process.env.npm_package_name,
	release = process.env.npm_package_version,
) => {
	const logger = new Logging().createLogger();

	logger.info(`Launching ${name} v${release}`);

	let tracesSampleRate = 1.0;

	try {
		tracesSampleRate = parseFloat(
			process.env.SENTRY_TRACE_SAMPLE_RATE || "1.0",
		);

		logger.info("Using custom tracesSampleRate", { tracesSampleRate });
	} catch (e) {
		logger.info("Using default tracesSampleRate", { tracesSampleRate });
	}

	Sentry.init({
		dsn: SENTRY_DSN,
		release,
		integrations: [
			new RewriteFrames({
				root: global.__rootdir__,
			}),
		],
		tracesSampleRate,
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
