import { injectable } from "inversify";
import { createConnection, Connection } from "typeorm";
import debug = require("debug");
import { User } from "../entities/User";

const {
	PGHOST,
	PGUSER,
	PGDATABASE,
	PGPASSWORD,
	PGPORT,
	NODE_ENV,
	DB_LOG,
} = process.env;

@injectable()
export class Database {
	connection: Promise<Connection>;

	constructor() {
		this.connection = this.setupConnection();

		this.runMigration();
	}

	private setupConnection() {
		const connection = createConnection({
			type: "postgres",
			host: PGHOST,
			port: +(PGPORT || "5432"),
			username: PGUSER,
			password: PGPASSWORD,
			database: PGDATABASE,
			entities: [User],
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

	getConnection() {
		return this.connection;
	}

	private async runMigration() {
		const connection = await this.connection;

		await connection.runMigrations();
	}

	async getUserRepository() {
		const connection = await this.connection;

		return connection.getRepository(User);
	}
}
