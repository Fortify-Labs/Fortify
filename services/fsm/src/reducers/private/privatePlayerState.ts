import { injectable } from "inversify";

import { Context } from "@shared/auth";
import { FortifyPlayerState } from "@shared/state";

import { PrivatePlayerState } from "../../gsiTypes";
import { StateReducer } from "../../definitions/stateReducer";

@injectable()
export class DummyPrivateStateReducer
	implements StateReducer<PrivatePlayerState> {
	name = "DummyPrivateStateReducer";

	async processor(
		state: FortifyPlayerState,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		context: Context,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		publicPlayerState: PrivatePlayerState,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		timestamp: string,
	) {
		return state;
	}
}
