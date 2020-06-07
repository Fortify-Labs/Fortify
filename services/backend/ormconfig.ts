import { ConnectionOptions } from "typeorm";

import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config());

const config: ConnectionOptions = {
	type: "postgres",
	host: process.env.PGHOST,
	port: Number(process.env.PGPORT),
	username: process.env.PGUSER,
	password: process.env.PGPASSWORD,
	database: process.env.PGDATABASE,

	entities: ["src/entities/**/*.ts"],
	migrations: ["src/migrations/**/*.ts"],
	subscribers: ["src/subscribers/**/*.ts"],
	cli: {
		migrationsDir: "src/migrations",

		entitiesDir: "src/entities",
		subscribersDir: "src/subscribers",
	},
};

export = config;
