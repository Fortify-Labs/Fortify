import { injectable } from "inversify";
import winston, { createLogger, transports, format } from "winston";

const { NODE_ENV } = process.env;
let { LOG_LEVEL } = process.env;

@injectable()
export class Logger {
	logger: winston.Logger;
	transports: Record<string, winston.transport>;

	log: winston.LogMethod;
	info: winston.LeveledLogMethod;
	error: winston.LeveledLogMethod;
	debug: winston.LeveledLogMethod;
	warn: winston.LeveledLogMethod;

	constructor() {
		const service = process.env.npm_package_name;
		const version = process.env.npm_package_version;

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

		this.transports = {
			console: new transports.Console({ level: LOG_LEVEL }),
		};

		this.logger = createLogger({
			defaultMeta,
			transports: [this.transports.console],
			format: combinedFormat,
		});

		this.log = this.logger.log.bind(this.logger);

		this.info = this.logger.info.bind(this.logger);
		this.error = this.logger.error.bind(this.logger);
		this.debug = this.logger.debug.bind(this.logger);
		this.warn = this.logger.warn.bind(this.logger);
	}
}
