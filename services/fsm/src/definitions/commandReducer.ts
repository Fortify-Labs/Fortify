import { FortifyPlayerState } from "@shared/state";
import { FortifyEvent } from "@shared/events/events";
import { SystemEventType } from "@shared/events/systemEvents";

export interface CommandReducer {
	name: string;

	processor: (
		state: FortifyPlayerState,
		event: FortifyEvent<SystemEventType>,
	) => Promise<FortifyPlayerState>;
}
