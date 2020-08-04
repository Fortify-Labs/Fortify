import { injectable, inject } from "inversify";
import {
	GameEventType,
	MatchStartedEvent,
	MatchFinalPlaceEvent,
	MatchEndedEvent,
} from "@shared/events/gameEvents";
import { FortifyEvent } from "@shared/events/events";
import { MatchService } from "@shared/services/match";
import debug from "debug";

@injectable()
export class MatchPersistor {
	constructor(@inject(MatchService) private matchService: MatchService) {}

	async handleEvent(event: FortifyEvent<GameEventType>) {
		try {
			if (event.type === GameEventType.MATCH_STARTED) {
				const startedEvent = MatchStartedEvent.deserialize(event);
				return this.startHandler(startedEvent);
			}
			if (event.type === GameEventType.FINAL_PLACE) {
				const finalPlaceEvent = MatchFinalPlaceEvent.deserialize(event);
				return this.finalPlaceHandler(finalPlaceEvent);
			}
			if (event.type === GameEventType.MATCH_ENDED) {
				const endedEvent = MatchEndedEvent.deserialize(event);
				return this.endedHandler(endedEvent);
			}
		} catch (e) {
			debug("app::MatchPersistor")(e);
		}
	}

	async startHandler(startedEvent: MatchStartedEvent) {
		return this.matchService.storeMatchStart(
			startedEvent.matchID,
			startedEvent.players,
		);
	}

	async finalPlaceHandler(finalPlaceEvent: MatchFinalPlaceEvent) {
		return this.matchService.storeFinalPlace(
			finalPlaceEvent.matchID,
			finalPlaceEvent.steamID,
			finalPlaceEvent.finalPlace,
		);
	}

	async endedHandler(endedEvent: MatchEndedEvent) {
		return this.matchService.storeMatchEnd(endedEvent.matchID);
	}
}
