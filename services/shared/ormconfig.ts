import { ConnectionOptions } from "typeorm";

import * as dotenv from "dotenv";
dotenv.config();

const config: ConnectionOptions = {
	type: "postgres",
	host: process.env.POSTGRES_HOST,
	port: parseInt(process.env.POSTGRES_PORT || "5432"),
	username: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	database: process.env.POSTGRES_DATABASE,

	entities: ["src/db/entities/**/*.ts"],
	migrations: ["src/db/migrations/**/*.ts"],
	subscribers: ["src/db/subscribers/**/*.ts"],
	cli: {
		migrationsDir: "src/db/migrations",

		entitiesDir: "src/db/entities",
		subscribersDir: "src/db/subscribers",
	},
};

export = config;
