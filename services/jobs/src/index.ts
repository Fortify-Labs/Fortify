import { config } from "dotenv";
config();

import debug from "debug";

import { sharedSetup } from "@shared/index";
global.__rootdir__ = __dirname || process.cwd();
sharedSetup();

import { captureException, flush } from "@sentry/node";

import { container } from "./inversify.config";

import yargs from "yargs";
import { FortifyScript } from "./scripts";
import { RedisConnector } from "@shared/connectors/redis";
import { PostgresConnector } from "@shared/connectors/postgres";
import { Secrets } from "./secrets";

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
			try {
				await container.get(Secrets).getSecrets();

				debug("app::run")(argv);

				if (container.isBound(argv.script)) {
					const fortifyScript = container.get<FortifyScript>(
						argv.script,
					);

					await fortifyScript.handler();
				} else {
					debug("app::run")("No matching script found");
				}

				// Close connections to gracefully complete
				await container.get(RedisConnector).client.quit();
				await (
					await container.get(PostgresConnector).connection
				).close();
			} catch (e) {
				debug("app::command::run")(e);
				const exceptionID = captureException(e);
				debug("app::command::run")(exceptionID);
				await flush();
				throw e;
			}
		},
	)
	.showHelpOnFail(true)
	.help("help", "Show help on failure")
	.demandCommand()
	.recommendCommands()
	.strict().argv;
