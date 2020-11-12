import { inject, injectable } from "inversify";

import debug = require("debug");

import { createConnection, Connection } from "typeorm";
import { User } from "../db/entities/user";
import { Match } from "../db/entities/match";
import { MatchSlot } from "../db/entities/matchSlot";
import { VaultConnector } from "./vault";

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
export class PostgresConnector {
	connection: Promise<Connection>;

	constructor(@inject(VaultConnector) private vault: VaultConnector) {
		this.connection = this.setupConnection();

		this.runMigration();
	}

	private async setupConnection() {
		const postgres = await this.vault.read("/postgres");
		const { password } = postgres.data.data;

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
