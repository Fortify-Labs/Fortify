import { FortifyPlayerState } from "../types";
import { PublicPlayerState } from "../gsiTypes";

export const publicPlayerStateReducer = (
	state: FortifyPlayerState,
	public_player_state: PublicPlayerState,
) => {
	// TODO: Find a reliable way to detect a new game
	// TODO: Find a reliable way to detect when a new game has been started being spectated

	const { final_place, persona_name, account_id } = public_player_state;

	state.players[account_id.toString()] = {
		name: persona_name ?? "",
		steamid: account_id.toString() ?? "",

		final_place,
	};

	if (final_place) {
		console.log(`${persona_name} (${account_id}) - ${final_place}`);
	}

	return state;
};
