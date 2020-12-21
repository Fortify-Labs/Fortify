import { injectable, inject } from "inversify";

import { CommandReducer } from "../definitions/commandReducer";
import { StateService } from "../services/state";
import {
	FSMResetRequestEvent,
	SystemEventType,
} from "@shared/events/systemEvents";
import { FortifyEvent } from "@shared/events/events";

@injectable()
export class ResetCommandReducer implements CommandReducer {
	constructor(
		@inject(StateService)
		private stateService: StateService,
	) {}

	name = "ResetCommandReducer";

	async processor(event: FortifyEvent<SystemEventType>) {
		if (event.type === SystemEventType.FSM_RESET_REQUEST) {
			const resetRequest = FSMResetRequestEvent.deserialize(event);
			return this.stateService.resetUserCaches(resetRequest.steamid);
		}

		return true;
	}
}
