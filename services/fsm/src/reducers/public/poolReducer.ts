import { injectable, inject } from "inversify";

import { Context } from "@shared/auth";
import { FortifyPlayerState } from "@shared/state";

import { PublicPlayerState } from "../../gsiTypes";
import { StateReducer } from "../../definitions/stateReducer";

import { PoolCalculatorService } from "../../services/poolCalculator";

@injectable()
export class PoolReducer implements StateReducer<PublicPlayerState> {
	public name = "PublicPoolReducer";

	constructor(
		@inject(PoolCalculatorService)
		private poolCalculator: PoolCalculatorService,
	) {}

	async processor(
		state: FortifyPlayerState,
		context: Context,
		publicPlayerState: PublicPlayerState,
	) {
		// Parse each players units first
		// Then enhance with data from units.json
		// Then do the pool size calculations afterwards

		if (publicPlayerState.units) {
			const { units } = publicPlayerState;

			// If a player doesn't yet exist
			if (!state.lobby.players[publicPlayerState.account_id]) {
				state.lobby.players[publicPlayerState.account_id] = {
					accountID: (publicPlayerState.account_id ?? "").toString(),
					name: (publicPlayerState.persona_name ?? "").toString(),
					slot: publicPlayerState.player_slot,
					finalPlace: 0,
				};
			}

			state.lobby.players[
				publicPlayerState.account_id
			].units = this.poolCalculator.mapPlayerUnits(units);
		}

		this.poolCalculator.calculatePublicPool(state);

		return state;
	}
}
