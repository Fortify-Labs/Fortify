import { injectable } from "inversify";
import { createLogger, transports, format } from "winston";

const { NODE_ENV } = process.env;
let { LOG_LEVEL } = process.env;

export interface LoggingProps {
	service?: string;
	version?: string;
}

@injectable()
export class Logging {
	createLogger({
		service = process.env.npm_package_name,
		version = process.env.npm_package_version,
	}: LoggingProps | undefined = {}) {
		// Log formatting
		let combinedFormat = format.combine(
			format.timestamp(),
			format.errors({ stack: true }),
			format((info) => {
				if (info["timestamp"]) {
					info["@timestamp"] = info["timestamp"];
					delete info["timestamp"];
				}

				return info;
			})(),
			format.json(),
		);

		if (NODE_ENV !== "production") {
			combinedFormat = format.combine(
				format.errors({ stack: true }),
				format.colorize(),
				format.simple(),
			);
		}

		// Log level settings
		if (!LOG_LEVEL) {
			if (NODE_ENV === "production") {
				LOG_LEVEL = "info";
			} else {
				LOG_LEVEL = "debug";
			}
		}

		// Default metadata settings
		let defaultMeta: Record<string, unknown> = {
			service,
			version,
		};

		if (NODE_ENV !== "production") {
			defaultMeta = {};
		}

		// Logger creating
		const logger = createLogger({
			defaultMeta,
			transports: [new transports.Console({ level: LOG_LEVEL })],
			format: combinedFormat,
		});

		return logger;
	}
}
