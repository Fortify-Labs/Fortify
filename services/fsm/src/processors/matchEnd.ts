import { injectable } from "inversify";
import { MatchState } from "@shared/state";
import {
	MatchEndedEvent,
	MatchFinalPlaceEvent,
} from "@shared/events/gameEvents";
import { EventService } from "@shared/services/eventService";

@injectable()
export class MatchEndDetector {
	constructor(public eventService: EventService) {}

	async process(state: MatchState, timestamp: string): Promise<MatchState> {
		// Check if players reached rank 1 or 2
		// --> match has ended
		const matchEnded = Object.values(state.players).reduce(
			(acc, { public_player_state: { final_place } }) =>
				acc || final_place === 2 || final_place === 1,
			false,
		);

		if (matchEnded) {
			// Check if a final_place 1 is not set
			// sometimes this is not sent

			const winner = Object.values(state.players).find(
				(p) => !p.public_player_state.final_place,
			);

			if (winner) {
				state.players[winner.id].public_player_state.final_place = 1;

				const winnerEvent = new MatchFinalPlaceEvent(
					state.id,
					winner.id,
					1,
				);
				winnerEvent.timestamp = new Date(timestamp);
				await this.eventService.sendEvent(
					winnerEvent,
					`match-${state.id}`,
				);
			}

			const matchEnded = new MatchEndedEvent(state.id);
			matchEnded.timestamp = new Date(timestamp);
			await this.eventService.sendEvent(matchEnded, `match-${state.id}`);

			state.ended = matchEnded.timestamp.getTime();
		}

		return state;
	}
}
