import { injectable } from "inversify";
import { Block } from "@shared/definitions/gsiTypes";
import { FortifyGameMode, MatchState } from "@shared/state";
import { StateService } from "../services/state";
import { EventService } from "@shared/services/eventService";
import {
	MatchFinalPlaceEvent,
	MatchStartedEvent,
} from "@shared/events/gameEvents";
import { RankProgressTracker } from "./rankProgress";
import { PoolProcessor } from "./pool";
import { MatchEndDetector } from "./matchEnd";
import { SmurfDetector } from "./smurf";
import { LeaderboardService } from "@shared/services/leaderboard";
import { ExtractorService } from "@shared/services/extractor";
import { LeaderboardType } from "@shared/definitions/leaderboard";

const { REQUIRED_UPDATES = "10" } = process.env;

export interface ProcessArgs {
	matchState: MatchState;
	block: Block;
	sourceAccountID: string;
	timestamp: string;
}

@injectable()
export class MatchProcessor {
	constructor(
		public stateService: StateService,
		public eventService: EventService,
		public rankProgressTracker: RankProgressTracker,
		public poolProcessor: PoolProcessor,
		public matchEndDetector: MatchEndDetector,
		public smurfDetector: SmurfDetector,
		public leaderboardService: LeaderboardService,
		public extractorService: ExtractorService,
	) {}

	async process({
		block,
		matchState,
		sourceAccountID,
		timestamp,
	}: ProcessArgs) {
		matchState.updateCount += 1;
		const promises: Promise<unknown>[] = [];
		// Run block update loop
		for (const {
			public_player_state,
			private_player_state,
		} of block.data) {
			if (public_player_state) {
				const {
					account_id,
					final_place,
					sequence_number,
				} = public_player_state;

				// Only update player state when the sequence number increased
				if (
					sequence_number >
					matchState.players[account_id].public_player_state
						.sequence_number
				) {
					// Check if a final place has changed
					if (
						matchState.players[account_id].public_player_state
							.final_place !== final_place
					) {
						const finalPlaceEvent = new MatchFinalPlaceEvent(
							matchState.id,
							account_id.toString(),
							final_place,
						);
						finalPlaceEvent.timestamp = new Date(timestamp);
						promises.push(
							this.eventService.sendEvent(
								finalPlaceEvent,
								`match-${matchState.id}`,
							),
						);
					}

					// Update player object
					matchState.players[account_id] = {
						id: account_id.toString(),
						public_player_state,
					};
				}
			}

			if (private_player_state) {
				// Theoretically it should be possible to just use the source account ID
				// as GSI is not sending any private player states of other users
				const { player_slot, sequence_number } = private_player_state;
				const publicPlayerState = Object.values(matchState.players)
					.map((p) => p.public_player_state)
					.find((p) => p.player_slot === player_slot);

				if (publicPlayerState) {
					const { account_id } = publicPlayerState;

					// Only update player state when the sequence number increased
					if (
						sequence_number >
						(matchState.players[account_id].private_player_state
							?.sequence_number ?? 0)
					) {
						matchState.players[account_id] = {
							...matchState.players[account_id],
							private_player_state,
						};
					}
				}
			}
		}
		await this.stateService.storeMatch(matchState.id, matchState);
		await Promise.allSettled(promises);

		if (!matchState.mode) {
			// --- Detect game mode ---

			// If all hp counts are greater than 4, we're dealing with a standard match
			// else we're dealing with a turbo match

			const isStandard = Object.values(
				matchState.players,
			).reduce<boolean>(
				(acc, { public_player_state: { health } }) => acc && health > 4,
				true,
			);

			if (isStandard) {
				matchState.mode = FortifyGameMode.Normal;
			} else {
				matchState.mode = FortifyGameMode.Turbo;
			}

			// Store average mmr
			const leaderboardType =
				matchState.mode === FortifyGameMode.Normal
					? LeaderboardType.Standard
					: LeaderboardType.Turbo;

			const leaderboard = await this.leaderboardService.fetchLeaderboard(
				leaderboardType,
			);
			matchState.averageMMR = parseFloat(
				this.extractorService.getAverageMMR(
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
					null,
				),
			);
		}

		// If we have received at least 10 messages for a specific match
		// and a game mode has been determined, it's safe to say that a
		// match is ongoing
		// Note: I'm using the update count == 11 as a one-off trigger
		if (matchState.updateCount === parseInt(REQUIRED_UPDATES) + 1) {
			const matchStartedEvent = new MatchStartedEvent(
				matchState.id,
				Object.values(matchState.players).map(
					({
						public_player_state: {
							account_id,
							final_place,
							persona_name,
							player_slot,
						},
					}) => ({
						accountID: account_id.toString(),
						finalPlace: final_place,
						name: persona_name,
						slot: player_slot,
					}),
				),
				matchState.mode,
			);
			matchStartedEvent.timestamp = new Date(timestamp);
			await this.eventService.sendEvent(
				matchStartedEvent,
				`match-${matchState.id}`,
			);

			// Rank Progress Tracking
			await this.rankProgressTracker.process(matchState, timestamp);
		}

		// Unit pool calculator
		matchState = await this.poolProcessor.process(matchState);
		await this.stateService.storeMatch(matchState.id, matchState);

		// Check if match players have reached rank 1 or 2
		// --> Send match ended event
		matchState = await this.matchEndDetector.process(matchState, timestamp);
		await this.stateService.storeMatch(matchState.id, matchState);

		// Smurf account detector & account linking
		matchState = await this.smurfDetector.process({
			block,
			matchState,
			sourceAccountID,
			timestamp,
		});
		await this.stateService.storeMatch(matchState.id, matchState);
	}
}
