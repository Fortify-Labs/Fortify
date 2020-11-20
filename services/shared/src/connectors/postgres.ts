import { inject, injectable } from "inversify";

import debug = require("debug");

import { createConnection, Connection } from "typeorm";
import { User } from "../db/entities/user";
import { Match } from "../db/entities/match";
import { MatchSlot } from "../db/entities/matchSlot";

import { SecretsManager } from "../services/secrets";
import { HealthCheckable } from "../services/healthCheck";

const {
	POSTGRES_USER,
	POSTGRES_HOST,
	POSTGRES_PORT,
	POSTGRES_DATABASE,
	// NODE_ENV,
	DB_LOG,
} = process.env;

// This way each service could specify the entities needed instead of all
@injectable()
export class PostgresConnector implements HealthCheckable {
	connection: Promise<Connection>;

	name = "Postgres";
	setupHealthCheck = async () => {};
	healthCheck: () => Promise<boolean>;
	shutdown: () => Promise<unknown>;

	constructor(
		@inject(SecretsManager)
		private secretsManager: SecretsManager<{
			postgres: { password: string | undefined };
		}>,
	) {
		this.connection = this.setupConnection();

		this.healthCheck = async () => {
			const conn = await this.connection;

			return conn.isConnected && conn.query("SELECT now();");
		};
		this.shutdown = async () =>
			(await this.connection).isConnected &&
			(await this.connection).close();
		this.runMigration();
	}

	private async setupConnection() {
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
			poolErrorHandler: debug("app::db"),
		});

		connection
			.then((db) => {
				debug("app::db")("DB connection established");
				return db;
			})
			.catch((reason) => {
				debug("app::db")("Connection rejected");
				debug("app::db")(reason);

				// Try to reconnect to the db every 5 seconds
				setTimeout(() => {
					this.connection = this.setupConnection();
				}, 5000);
			});

		return connection;
	}

	private async runMigration() {
		const connection = await this.connection;

		await connection.runMigrations();
	}

	async getUserRepo() {
		return this.connection.then((connection) =>
			connection.getRepository(User),
		);
	}

	async getMatchRepo() {
		return this.connection.then((connection) =>
			connection.getRepository(Match),
		);
	}

	async getMatchSlotRepo() {
		return this.connection.then((connection) =>
			connection.getRepository(MatchSlot),
		);
	}
}
