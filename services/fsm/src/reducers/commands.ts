import {
	FortifyPlayerState,
	FortifyFSMCommand,
	FortifyFSMCommandType,
} from "../types";

export const commandReducer = (
	state: FortifyPlayerState,
	command: FortifyFSMCommand,
) => {
	if (command.type === FortifyFSMCommandType.RESET) {
		state.lobby.players = {};
	}

	return state;
};
