import { FortifyPlayerState, FortifyFSMCommand } from "@shared/state";

export interface CommandReducer {
	name: string;

	processor: (
		state: FortifyPlayerState,
		command: FortifyFSMCommand,
	) => Promise<FortifyPlayerState>;
}
