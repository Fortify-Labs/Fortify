import { injectable } from "inversify";

import { Context } from "@shared/definitions/context";
import { FortifyPlayerState } from "@shared/state";

import { PrivatePlayerState } from "@shared/definitions/gsiTypes";
import { StateReducer } from "../../definitions/stateReducer";

@injectable()
export class DummyPrivateStateReducer
	implements StateReducer<PrivatePlayerState> {
	name = "DummyPrivateStateReducer";

	async processor(
		state: FortifyPlayerState,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		context: Pick<Context, "user">,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		publicPlayerState: PrivatePlayerState,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		timestamp: string,
	) {
		return state;
	}
}
