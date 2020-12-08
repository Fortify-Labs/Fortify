import { FortifyPlayerState } from "@shared/state";
import { Context } from "@shared/definitions/context";

import {
	PublicPlayerState,
	PrivatePlayerState,
} from "@shared/definitions/gsiTypes";

export interface StateReducer<T = PublicPlayerState | PrivatePlayerState> {
	name: string;

	processor: (
		state: FortifyPlayerState,
		context: Pick<Context, "user">,
		publicPlayerState: T,
		timestamp: string,
	) => Promise<FortifyPlayerState>;
}
