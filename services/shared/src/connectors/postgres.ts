import { injectable } from "inversify";

import { createConnection, Connection } from "typeorm";
import { User } from "../db/entities/user";

// TODO: Refactor this to take dynamic entities
// This way each service could specify the entities needed instead of all
@injectable()
export class PostgresConnector {
	connection: Promise<Connection>;

	constructor() {
		this.connection = createConnection({
			entities: [User],
			synchronize: true,
			type: "postgres",
			url: process.env.POSTGRES_URL,
		});
	}

	async getUserRepo() {
		return this.connection.then((connection) =>
			connection.getRepository(User),
		);
	}
}
