import { injectable, inject } from "inversify";
import fetch from "node-fetch";
import debug = require("debug");

import { FortifyScript } from "../scripts";

import { ULLeaderboard } from "@shared/typings/leaderboard";
import { RedisConnector } from "@shared/connectors/redis";

const { LEADERBOARD_TYPE = "standard" } = process.env;

@injectable()
export class LeaderboardImportService implements FortifyScript {
	name = "LeaderboardImportService";

	constructor(@inject(RedisConnector) private redis: RedisConnector) {}

	async handler() {
		const type = LEADERBOARD_TYPE;

		const leaderboard: ULLeaderboard = await fetch(
			"https://underlords.com/leaderboarddata?type=" + type,
		).then((value) => value.json());

		debug("app::leaderboardImport")(`${type} leaderboard fetched`);

		await this.redis.setAsync(
			"ul_leaderboard_" + type.toLowerCase(),
			JSON.stringify(leaderboard),
		);

		debug("app::leaderboardImport")(`${type} leaderboard stored to redis`);
	}
}
