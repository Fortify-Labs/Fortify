import { injectable } from "inversify";

import fetch from "node-fetch";

import { LeaderboardType, ULLeaderboard } from "../definitions/leaderboard";

@injectable()
export class LeaderboardService {
	// TODO: Rework this to use database instead of fetching the Underlords API every time the leaderboard is requested

	fetchLeaderboard(type = LeaderboardType.Standard): Promise<ULLeaderboard> {
		return fetch(
			"https://underlords.com//leaderboarddata?type=" + type,
		).then((value) => value.json());
	}
}
