import { inject, injectable } from "inversify";

import { createConnection, Connection } from "typeorm";
import { User } from "../db/entities/user";
import { Match } from "../db/entities/match";
import { MatchSlot } from "../db/entities/matchSlot";

import { SecretsManager, SecretsRequest } from "../services/secrets";
import { HealthCheckable } from "../services/healthCheck";
import { Logger } from "../logger";
import { Connector } from "../definitions/connector";
import { MmrStats } from "../db/entities/mmr";
import { ItemStats, SynergyStats, UnitStats } from "../db/entities/stats";

const {
	POSTGRES_USER,
	POSTGRES_HOST,
	POSTGRES_PORT,
	POSTGRES_DATABASE,
	POSTGRES_SSL = "false",
	DB_LOG,
} = process.env;

type PostgresSecrets = {
	postgres: {
		password: string;
	};
};

@injectable()
export class PostgresSecretsRequest implements SecretsRequest {
	requestedSecrets = {
		postgres: {
			password: "",
		},
	} as PostgresSecrets;
}

// This way each service could specify the entities needed instead of all
@injectable()
export class PostgresConnector implements HealthCheckable, Connector {
	_connection?: Connection;

	name = "Postgres";
	setupHealthCheck = async () => {};
	healthCheck: () => Promise<boolean>;
	shutdown: () => Promise<unknown>;

	constructor(
		@inject(SecretsManager)
		private secretsManager: SecretsManager<PostgresSecrets>,
		@inject(Logger) public logger: Logger,
	) {
		this.healthCheck = async () => {
			this.logger.debug("Starting Postgres health check");

			const result =
				this._connection?.isConnected &&
				(await this._connection.query("SELECT now();"));

			if (!result) {
				this.logger.error("Postgres health check failed", {
					e: result,
				});
				this.logger.error(result);
			}

			this.logger.debug("Finished Postgres health check");

			return result;
		};

		this.shutdown = async () => {
			// if (this._connection?.isConnected) {
			// 	await this._connection?.close();
			// 	this._connection = undefined;
			// }
		};
	}

	async connect() {
		const {
			postgres: { password },
		} = await this.secretsManager.getSecrets();

		const connection = createConnection({
			type: "postgres",
			host: POSTGRES_HOST,
			port: parseInt(POSTGRES_PORT ?? "5432"),
			username: POSTGRES_USER,
			password,
			database: POSTGRES_DATABASE ?? "fortify",
			entities: ["../shared/build/src/db/entities/**/*.js"],
			migrations: ["../shared/build/src/db/migrations/**/*.js"],
			migrationsRun: true,
			// synchronize: NODE_ENV === "development",
			synchronize: false,
			logging: DB_LOG === "true",
			ssl:
				POSTGRES_SSL === "true"
					? {
							rejectUnauthorized: false,
					  }
					: undefined,
			poolErrorHandler: (e) => {
				this.logger.error("Postgres pool connection error occurred", {
					e,
				});
				this.logger.error(e);
			},
		});

		connection
			.then((db) => {
				this.logger.info("Postgres connection established");
				return db;
			})
			.catch((reason) => {
				this.logger.error("Connection rejected", { reason });
				this.logger.error(reason);

				// Try to reconnect to the db every 5 seconds
				setTimeout(async () => {
					this._connection = await this.connect();
				}, 5000);
			});

		this._connection = await connection;
		await this.runMigration();

		return connection;
	}

	get connection() {
		if (!this._connection) {
			throw new Error("Not connected to Postgres");
		}

		return this._connection;
	}

	private async runMigration() {
		await this.connection.runMigrations();
	}

	getUserRepo() {
		return this.connection.getRepository(User);
	}

	getMatchRepo() {
		return this.connection.getRepository(Match);
	}

	getMatchSlotRepo() {
		return this.connection.getRepository(MatchSlot);
	}

	getMmrStatsRepo() {
		return this.connection.getRepository(MmrStats);
	}

	getUnitStatsRepo() {
		return this.connection.getRepository(UnitStats);
	}

	getItemStatsRepo() {
		return this.connection.getRepository(ItemStats);
	}

	getSynergyStatsRepo() {
		return this.connection.getRepository(SynergyStats);
	}
}
