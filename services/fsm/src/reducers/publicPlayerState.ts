import { FortifyPlayerState } from "@shared/state";
import { PublicPlayerState } from "../gsiTypes";

export const publicPlayerStateReducer = (
	state: FortifyPlayerState,
	public_player_state: PublicPlayerState,
) => {
	// TODO: Find a reliable way to detect a new game

	/* 	Scenarios when a new game has been started:
		- public information about a level 1 player / lower level than existing in player state
		- additional player ids exceeding the 8 playing (not sure how this is going to work with spectators though)
		- all boards are empty
	*/

	// TODO: Find a reliable way to detect when a new game has been started being spectated

	const {
		final_place,
		persona_name,
		account_id,
		level,
	} = public_player_state;

	// Checking wether a level 1 information has been received and the player state object contains more than 8 player information
	// Gonna use <= comparator as I'm not sure wether levels start at 1 or 0
	if (level <= 1 && Object.keys(state.lobby.players).length > 7) {
		state.lobby.players = {};
	}

	const accountID = account_id.toString();

	state.lobby.players[accountID] = {
		name: persona_name ?? "",
		steamid: accountID,

		final_place,
	};

	if (final_place) {
		console.log(`${persona_name} (${account_id}) - ${final_place}`);
	}

	return state;
};
