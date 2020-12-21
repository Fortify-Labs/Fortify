import { injectable } from "inversify";
import { FortifyGameMode, MatchState } from "@shared/state";
import { RankTierUpdateEvent } from "@shared/events/gameEvents";
import { EventService } from "@shared/services/eventService";

@injectable()
export class RankProgressTracker {
	constructor(public eventService: EventService) {}

	async process(matchState: MatchState, timestamp: string) {
		const promises: Promise<void>[] = [];

		for (const {
			public_player_state: { rank_tier, account_id },
		} of Object.values(matchState.players)) {
			if (rank_tier > 0) {
				const rankTierUpdate = new RankTierUpdateEvent(
					account_id.toString(),
					rank_tier,
					matchState.mode ?? FortifyGameMode.Invalid,
				);
				rankTierUpdate.timestamp = new Date(timestamp);

				promises.push(
					this.eventService.sendEvent(
						rankTierUpdate,
						`match-${matchState.id}`,
					),
				);
			}
		}

		return Promise.allSettled(promises);
	}
}
