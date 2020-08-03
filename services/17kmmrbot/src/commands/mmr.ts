import { injectable, inject } from "inversify";

import { TwitchCommand } from "../definitions/twitchCommand";
import { Client } from "tmi.js";

import { ExtractorService } from "@shared/services/extractor";
import { LeaderboardService } from "../services/leaderboard";
import {
	LeaderboardType,
	ULLeaderboard,
} from "@shared/definitions/leaderboard";
import { FortifyGameMode } from "@shared/state";
import debug = require("debug");

@injectable()
export class MMRCommand implements TwitchCommand {
	constructor(
		@inject(ExtractorService) private extractorService: ExtractorService,
		@inject(LeaderboardService)
		private leaderboardService: LeaderboardService,
	) {}

	invocations = ["!mmr"];

	handler = async (client: Client, channel: string) => {
		try {
			const user = await this.extractorService.getUser(channel);

			// Fetch fortify player state by steamid
			const fps = await this.extractorService.getPlayerState(
				user.steamid,
			);

			if (!fps) {
				return client.say(
					channel,
					"No player state found for " + user.name,
				);
			}

			const lobbyUser = fps.lobby.players[user.steamid];

			if (!lobbyUser) {
				return client.say(
					channel,
					`Could not find ${user.name} in the current lobby`,
				);
			}

			let player: Player | null = null;

			// TODO: Refactor the following to be more efficient when querying data from postgres
			// TODO: Refactor this together with the np command
			if ((lobbyUser.rank_tier ?? 0) < 80) {
				player = await this.extractorService.getPlayer(lobbyUser, null);
			} else {
				const gameMode = await this.extractorService.getGameMode(fps);

				if (
					!gameMode ||
					gameMode === FortifyGameMode[FortifyGameMode.Invalid]
				) {
					return client.say(channel, "No game mode detected");
				}

				let leaderboard: ULLeaderboard | null = null;

				if (gameMode === FortifyGameMode[FortifyGameMode.Normal]) {
					leaderboard = await this.leaderboardService.fetchLeaderboard(
						LeaderboardType.Standard,
					);
				} else if (
					gameMode === FortifyGameMode[FortifyGameMode.Turbo]
				) {
					leaderboard = await this.leaderboardService.fetchLeaderboard(
						LeaderboardType.Turbo,
					);
				} else if (gameMode === FortifyGameMode[FortifyGameMode.Duos]) {
					leaderboard = await this.leaderboardService.fetchLeaderboard(
						LeaderboardType.Duos,
					);
				}

				player = await this.extractorService.getPlayer(
					lobbyUser,
					leaderboard,
				);
			}

			return client.say(
				channel,
				`${user.name} [#${player.rank}, MMR: ${player.mmr}]`,
			);
		} catch (e) {
			debug("app::mmr")(e);
		}

		return false;
	};
}
