import { injectable, inject } from "inversify";
import { TwitchCommand } from "../definitions/twitchCommand";

import { ChatUserstate, Client } from "tmi.js";

import { ExtractorService } from "@shared/services/extractor";

import {
	FortifyGameMode,
	MatchState,
	PlayerSnapshot,
	UserCacheKey,
} from "@shared/state";
import { LeaderboardService } from "@shared/services/leaderboard";
import {
	ULLeaderboard,
	LeaderboardType,
} from "@shared/definitions/leaderboard";

import { RedisConnector } from "@shared/connectors/redis";
import { majorRankNameMapping } from "@shared/ranks";
import { captureTwitchException } from "../lib/sentryUtils";
import { Logging } from "@shared/logging";
import winston from "winston";

@injectable()
export class NotablePlayersCommand implements TwitchCommand {
	logger: winston.Logger;

	constructor(
		@inject(ExtractorService) private extractorService: ExtractorService,
		@inject(LeaderboardService)
		private leaderboardService: LeaderboardService,
		@inject(RedisConnector) private redis: RedisConnector,
		private logging: Logging,
	) {
		this.logger = logging.createLogger();
	}

	invocations = ["!np", "!lobby"];
	showInHelp = true;
	description =
		"Displays a full summary of the lobby, including players ranks and MMR. Also calculates the average for the lobby";

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

				// As the leaderboard ranks in the public player state are not duos rankings,
				// I am not going to be printing any mmr here.
				return client.say(
					channel,
					`${FortifyGameMode[matchState.mode]}: ${Object.values(
						matchState.players,
					)
						.map(
							(player) =>
								`${player.public_player_state.persona_name}`,
						)
						.join(", ")}`,
				);
			}

			// Get current user to calculate average based on the user (or spectator)
			const lobbyUser = matchState.players[user.steamid] as
				| PlayerSnapshot
				| undefined;

			if (Object.keys(matchState.players).length < 8) {
				return client.say(
					channel,
					"Collecting game data, please try again in a little bit",
				);
			}

			const averageMMR = this.extractorService.getAverageMMR(
				Object.values(matchState.players).map(
					({
						public_player_state: {
							global_leaderboard_rank,
							rank_tier,
						},
					}) => ({
						global_leaderboard_rank,
						rank_tier,
					}),
				),
				leaderboard,
				{
					global_leaderboard_rank:
						lobbyUser?.public_player_state.global_leaderboard_rank,
					rank_tier: lobbyUser?.public_player_state.rank_tier,
				},
			);

			let response = `${
				FortifyGameMode[matchState.mode]
			} [${averageMMR} avg MMR]: `;

			// Get players and sort them by mmr rank
			const playerPromises = Object.values(matchState.players).map(
				({
					public_player_state: {
						persona_name,
						global_leaderboard_rank,
						rank_tier,
					},
				}) =>
					this.extractorService.getPlayer(
						{
							name: persona_name,
							global_leaderboard_rank,
							rank_tier,
						},
						leaderboard,
					),
			);

			const players = (await Promise.all(playerPromises)).sort((a, b) =>
				a.mmr > b.mmr ? -1 : b.mmr > a.mmr ? 1 : 0,
			);

			for (const { name, rank, mmr } of players) {
				try {
					// Ranks equals and greater than zero will always be lord rankings
					if (rank >= 0 && mmr > 0) {
						response += `${name} [#${rank}, MMR: ${mmr}], `;
					}

					// If the rank is negative, that means that we're dealing with a rank_tier instead of actual rank
					else if (rank <= 0) {
						const minorRank = (-rank ?? 0) % 10;
						const majorRank = ((-rank ?? 0) - minorRank) / 10;

						const rankName =
							majorRankNameMapping[majorRank] +
							" " +
							(minorRank + 1);

						response += `${name} [${rankName}, MMR: ${mmr}], `;
					}
				} catch (e) {
					continue;
				}
			}
			response = response.slice(0, -2);

			client.say(channel, response);
		} catch (e) {
			const exceptionID = captureTwitchException(
				e,
				channel,
				tags,
				message,
			);

			this.logger.error(
				"An error occurred while executing the notable player command",
				{
					exceptionID,
					e,
					channel,
					tags,
					message,
					command: "!np",
				},
			);
			this.logger.error(e, {
				exceptionID,
				channel,
				tags,
				message,
				command: "!np",
			});

			await client.say(
				channel,
				`Something went wrong. (Exception ID: ${exceptionID})`,
			);
		}

		return;
	};
}
