import { inject, injectable } from "inversify";

import { createConnection, Connection } from "typeorm";
import { User } from "../db/entities/user";
import { Match } from "../db/entities/match";
import { MatchSlot } from "../db/entities/matchSlot";

import { SecretsManager, SecretsRequest } from "../services/secrets";
import { HealthCheckable } from "../services/healthCheck";
import { Logger } from "../logger";
import { Connector } from "../definitions/connector";

const {
	POSTGRES_USER,
	POSTGRES_HOST,
	POSTGRES_PORT,
	POSTGRES_DATABASE,
	// NODE_ENV,
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
			return (
				this._connection?.isConnected &&
				(await this._connection.query("SELECT now();"))
			);
		};
		this.shutdown = async () => {
			if (this._connection?.isConnected) {
				await this._connection?.close();
				this._connection = undefined;
			}
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

	async getUserRepo() {
		return this.connection.getRepository(User);
	}

	async getMatchRepo() {
		return this.connection.getRepository(Match);
	}

	async getMatchSlotRepo() {
		return this.connection.getRepository(MatchSlot);
	}
}
