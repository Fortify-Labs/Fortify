import { injectable, inject } from "inversify";
import { FortifyGameMode, FortifyPlayerState } from "@shared/state";

import { Context } from "@shared/auth";

import { PublicPlayerState } from "../gsiTypes";
import { StateReducer } from "../definitions/stateReducer";
import { StateTransformationService } from "../services/stateTransformer";

@injectable()
export class PlayerReducer implements StateReducer<PublicPlayerState> {
	constructor(
		@inject(StateTransformationService)
		private sts: StateTransformationService,
	) {}

	name = "PlayerReducer";

	async processor(
		state: FortifyPlayerState,
		context: Context,
		publicPlayerState: PublicPlayerState,
	) {
		// TODO: Find a reliable way to detect a new game

		/* 	Scenarios when a new game has been started:
		- public information about a level 1 player / lower level than existing in player state
		- additional player ids exceeding the 8 playing (not sure how this is going to work with spectators & duos though)
		- all boards are empty
		*/

		// TODO: Find a reliable way to detect when a new game has been started being spectated

		const {
			account_id,
			final_place,
			health,
			level,
			persona_name,
			rank_tier,
			global_leaderboard_rank,
		} = publicPlayerState;

		// Checking wether a level 1 information has been received and the player state object contains more than 8 player information
		// Gonna use <= comparator as I'm not sure wether levels start at 1 or 0
		if (level <= 1 && Object.keys(state.lobby.players).length > 7) {
			// if (level <= 1) {
			state = this.sts.resetState(state);
		}

		// For now we are only going to detect wether the match started is standard or KO
		// If we get 100 hp, we can be sure that the game mode is standard
		if (state.mode === FortifyGameMode.Invalid) {
			if (health === 100) {
				state.mode = FortifyGameMode.Normal;
			}

			// TODO: Find out how health is tracked for KO and Duos
			if (level === 1 && health === 4) {
				state.mode = FortifyGameMode.Turbo;
			}
		}

		const accountID = account_id.toString();

		state.lobby.players[accountID] = {
			final_place,
			global_leaderboard_rank,
			name: persona_name ?? "",
			rank_tier,
		};

		// if (final_place) {
		// 	console.log(`${persona_name} (${account_id}) - ${final_place}`);
		// }

		// if (final_place === 1) {
		// 	console.log(state);
		// 	console.log("Lobby finished");
		// }

		return state;
	}
}
