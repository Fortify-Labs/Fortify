import { injectable, inject } from "inversify";

import {
	FortifyFSMCommand,
	FortifyFSMCommandType,
	FortifyPlayerState,
} from "@shared/state";
import { CommandReducer } from "../definitions/commandReducer";
import { StateTransformationService } from "../services/stateTransformer";

@injectable()
export class ResetCommandReducer implements CommandReducer {
	constructor(
		@inject(StateTransformationService)
		private sts: StateTransformationService,
	) {}

	name = "ResetCommandReducer";

	async processor(state: FortifyPlayerState, command: FortifyFSMCommand) {
		if (command.type === FortifyFSMCommandType.RESET) {
			state = this.sts.resetState(state);
		}

		return state;
	}
}
