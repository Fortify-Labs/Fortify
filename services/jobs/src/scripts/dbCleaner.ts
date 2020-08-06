import { injectable, inject } from "inversify";
import debug = require("debug");

import { FortifyScript } from "../scripts";
import { PostgresConnector } from "@shared/connectors/postgres";
import { Match } from "@shared/db/entities/match";

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
			.createQueryBuilder("matches")
			.where('"matchStartTime" = "lastMatchUpdateTime"')
			.andWhere('"matchEndTime" IS NULL')
			// Do not delete any match entries of the past two hours
			// The idea behind that is to not accidentally delete started matches
			.andWhere("\"matchStartTime\" <= (NOW() - INTERVAL '2 HOURS')")
			.leftJoinAndSelect("matches.slots", "slots")
			// })
			.getMany();

		const emptyOldMatches = oldMatches.reduce<Match[]>((acc, match) => {
			const containsFinalPlaces = match.slots?.reduce(
				(acc, slot) => acc || slot.finalPlace != 0,
				false,
			);

			if (!containsFinalPlaces) {
				match.slots = match.slots.map((slot) => ({
					...slot,
					match,
				}));

				acc.push(match);
			}

			return acc;
		}, []);

		const slots = emptyOldMatches
			.map((match) => match.slots)
			.reduce((acc, entry) => [...acc, ...entry], []);

		// First remove all matchSlot entries to avoid foreign key issues while removing the matches
		if (slots.length) {
			await matchSlotRepo.remove(slots);
		}

		if (emptyOldMatches.length) {
			await matchRepo.remove(emptyOldMatches);
		}

		debug("app::DBCleanupScript")(
			`DB cleanup completed. Removed ${emptyOldMatches.length} matches`,
		);
	}
}
