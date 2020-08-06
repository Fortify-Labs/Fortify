import { injectable, inject } from "inversify";
import debug = require("debug");

import { FortifyScript } from "../scripts";
import { PostgresConnector } from "@shared/connectors/postgres";

@injectable()
export class DBCleanupScript implements FortifyScript {
	name = "DBCleanupScript";

	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
	) {}

	async handler() {
		// Clean up all fault matches
		// Fault matches includes those that were allegedly started
		// Yet never concluded and the match start time is also the last time it got updated

		const matchRepo = await this.postgres.getMatchRepo();
		const matchSlotRepo = await this.postgres.getMatchSlotRepo();

		const oldMatches = await matchRepo
			.createQueryBuilder()
			.where('"matchStartTime" = "lastMatchUpdateTime"')
			.andWhere('"matchEndTime" IS NULL')
			// Do not delete any match entries of the past two hours
			// The idea behind that is to not accidentally delete started matches
			.andWhere("\"matchStartTime\" <= (NOW() - INTERVAL '2 HOURS')")
			.loadAllRelationIds({
				relations: ["slots"],
			})
			.getMany();

		// First remove all matchSlot entries to avoid foreign key issues while removing the matches
		await matchSlotRepo.remove(
			oldMatches
				.map((match) => match.slots)
				.reduce((acc, entry) => [...acc, ...entry], []),
		);
		await matchRepo.remove(oldMatches);

		debug("app::DBCleanupScript")(
			`DB cleanup completed. Removed ${oldMatches.length} matches`,
		);
	}
}
