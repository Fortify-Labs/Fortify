import { injectable, inject } from "inversify";

import { FortifyPlayerState } from "@shared/state";
import { CommandReducer } from "../definitions/commandReducer";
import { StateTransformationService } from "../services/stateTransformer";
import { SystemEventType } from "@shared/events/systemEvents";
import { FortifyEvent } from "@shared/events/events";

@injectable()
export class ResetCommandReducer implements CommandReducer {
	constructor(
		@inject(StateTransformationService)
		private sts: StateTransformationService,
	) {}

	name = "ResetCommandReducer";

	async processor(
		state: FortifyPlayerState,
		event: FortifyEvent<SystemEventType>,
	) {
		if (event.type === SystemEventType.FSM_RESET_REQUEST) {
			state = this.sts.resetState(state);
		}

		return state;
	}
}
