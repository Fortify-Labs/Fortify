import { FortifyPlayerState } from "../types";
import { PrivatePlayerState } from "../gsiTypes";

export const privatePlayerStateReducer = (
	state: FortifyPlayerState,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private_player_state: PrivatePlayerState,
) => {
	return state;
};
