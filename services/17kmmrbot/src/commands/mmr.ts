import { injectable, inject } from "inversify";

import debug = require("debug");

import { TwitchCommand } from "../definitions/twitchCommand";
import { ChatUserstate, Client } from "tmi.js";

import { ExtractorService } from "@shared/services/extractor";
import { LeaderboardService } from "@shared/services/leaderboard";
import {
	LeaderboardType,
	ULLeaderboard,
} from "@shared/definitions/leaderboard";
import { FortifyGameMode, MatchState, UserCacheKey } from "@shared/state";
import { Player } from "@shared/definitions/player";
import { captureTwitchException } from "../lib/sentryUtils";
import { RedisConnector } from "@shared/connectors/redis";

@injectable()
export class MMRCommand implements TwitchCommand {
	constructor(
		@inject(ExtractorService) private extractorService: ExtractorService,
		@inject(LeaderboardService)
		private leaderboardService: LeaderboardService,
		@inject(RedisConnector) private redis: RedisConnector,
	) {}

	invocations = ["!mmr"];
	showInHelp = true;
	description = "Display current leaderboard MMR";

	handler = async (
		client: Client,
		channel: string,
		tags: ChatUserstate,
		message: string,
	) => {
		try {
			const user = await this.extractorService.getUser(channel);

			const matchID = await this.redis.getAsync(
				`user:${user.steamid}:${UserCacheKey.matchID}`,
			);

			if (!matchID) {
				return client.say(
					channel,
					"No match id found for " + user.name,
				);
			}

			// Fetch fortify player state by steamid
			const rawMatch = await this.redis.getAsync(`match:${matchID}`);

			if (!rawMatch) {
				return client.say(channel, "No match found for " + user.name);
			}

			const matchState: MatchState = JSON.parse(rawMatch);

			const lobbyUser = matchState.players[user.steamid];

			if (!lobbyUser) {
				return client.say(
					channel,
					`Could not find ${user.name} in the current lobby`,
				);
			}

			let player: Player | null = null;

			if ((lobbyUser.public_player_state.rank_tier ?? 0) < 80) {
				player = await this.extractorService.getPlayer(
					{
						name: lobbyUser.public_player_state.persona_name,
						global_leaderboard_rank:
							lobbyUser.public_player_state
								.global_leaderboard_rank,
						rank_tier: lobbyUser.public_player_state.rank_tier,
					},
					null,
				);
			} else {
				if (!matchState.mode) {
					return client.say(channel, "No game mode detected");
				}

				let leaderboard: ULLeaderboard | null = null;

				if (matchState.mode === FortifyGameMode.Normal) {
					leaderboard = await this.leaderboardService.fetchLeaderboard(
						LeaderboardType.Standard,
					);
				} else if (matchState.mode === FortifyGameMode.Turbo) {
					leaderboard = await this.leaderboardService.fetchLeaderboard(
						LeaderboardType.Turbo,
					);
				} else if (matchState.mode === FortifyGameMode.Duos) {
					leaderboard = await this.leaderboardService.fetchLeaderboard(
						LeaderboardType.Duos,
					);
				}

				player = await this.extractorService.getPlayer(
					{
						name: lobbyUser.public_player_state.persona_name,
						global_leaderboard_rank:
							lobbyUser.public_player_state
								.global_leaderboard_rank,
						rank_tier: lobbyUser.public_player_state.rank_tier,
					},
					leaderboard,
				);
			}

			return client.say(
				channel,
				`Player: ${user.name} [#${player.rank}, MMR: ${player.mmr}]`,
			);
		} catch (e) {
			debug("app::mmr")(e);
			captureTwitchException(e, channel, tags, message);
		}

		return false;
	};
}
