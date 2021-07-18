import { config } from "dotenv";
config();

import { sharedSetup } from "@shared/index";
(global as any).__rootdir__ = __dirname || process.cwd();
sharedSetup();

import { captureException, flush } from "@sentry/node";

import { container } from "./inversify.config";

import yargs from "yargs";
import { FortifyScript } from "./scripts";
import { RedisConnector } from "@shared/connectors/redis";
import { PostgresConnector } from "@shared/connectors/postgres";
import { Secrets } from "./secrets";
import { HealthCheck } from "@shared/services/healthCheck";
import { Connector } from "@shared/definitions/connector";
import { Logger } from "@shared/logger";

const { NODE_ENV } = process.env;

yargs
	.command(
		"run [script]",
		"run the specified script",
		(_yargs) => {
			return _yargs.positional("script", {
				describe: "script to run",
				default: "dummy",
				type: "string",
			});
		},
		async (argv) => {
			const logger = container.get(Logger);
			try {
				await container.get(Secrets).getSecrets();
				await Promise.all(
					container
						.getAll<Connector>("connector")
						.map((connector) => connector.connect()),
				);
				const healthCheck = container.get(HealthCheck);
				await healthCheck.start();

				logger.info("arguments", { argv });

				if (container.isBound(argv.script)) {
					const fortifyScript = container.get<FortifyScript>(
						argv.script,
					);

					healthCheck.live = true;
					await fortifyScript.handler();
				} else {
					logger.error(`No matching script found for ${argv.script}`);
				}

				// Close connections to gracefully complete
				await container.get(RedisConnector).client.quit();
				await (
					await container.get(PostgresConnector).connection
				).close();

				process.kill(process.pid, "SIGTERM");
			} catch (e) {
				const exceptionID = captureException(e);

				logger.error("Command run failed", {
					e,
					exceptionID,
				});

				logger.error(e, { exceptionID });

				await flush(10000).catch(() => {});
				throw e;
			}
		},
	)
	.showHelpOnFail(NODE_ENV !== "production")
	.help("help", "Show help message")
	.demandCommand()
	.recommendCommands()
	.strict().argv;
