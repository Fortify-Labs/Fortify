import { injectable } from "inversify";

import debug = require("debug");

import { createConnection, Connection } from "typeorm";
import { User } from "../db/entities/user";
import { Match } from "../db/entities/match";
import { MatchPlayer } from "../db/entities/matchPlayer";
import { MatchSlot } from "../db/entities/matchSlot";

const {
	POSTGRES_USER,
	POSTGRES_PASSWORD,
	POSTGRES_HOST,
	POSTGRES_PORT,
	POSTGRES_DATABASE,
	NODE_ENV,
	DB_LOG,
} = process.env;

// TODO: Refactor this to take dynamic entities
// This way each service could specify the entities needed instead of all
@injectable()
export class PostgresConnector {
	connection: Promise<Connection>;

	constructor() {
		this.connection = this.setupConnection();

		this.runMigration();
	}

	private setupConnection() {
		const connection = createConnection({
			type: "postgres",
			host: POSTGRES_HOST,
			port: parseInt(POSTGRES_PORT ?? "5432"),
			username: POSTGRES_USER,
			password: POSTGRES_PASSWORD,
			database: POSTGRES_DATABASE ?? "fortify",
			entities: [User, Match, MatchSlot, MatchPlayer],
			synchronize: NODE_ENV !== "production",
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

	async getMatchPlayerRepo() {
		return this.connection.then((connection) =>
			connection.getRepository(MatchPlayer),
		);
	}
}
