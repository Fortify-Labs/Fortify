import { injectable } from "inversify";
import { FortifyGameMode, MatchState } from "@shared/state";
import { units, currentSeason, Unit as S1Unit } from "@shared/units";
import { poolSize } from "@shared/pool";

@injectable()
export class PoolProcessor {
	private mappedUnits: Record<number, S1Unit>;

	constructor() {
		// Import and map current units
		this.mappedUnits = Object.entries(units[currentSeason]).reduce<
			Record<number, S1Unit>
		>((acc, entry) => {
			acc[entry[1].id] = entry[1];

			return acc;
		}, {});
	}

	async process(state: MatchState): Promise<MatchState> {
		// --- Pool calculations ---

		// The pool calculations will be (re-)done every time a new block is received
		state.pool = {};

		// 1. Reset the unit pool counts
		for (const { id, draftTier } of Object.values(this.mappedUnits)) {
			state.pool[id] =
				poolSize[draftTier] ??
				0 * (state.mode === FortifyGameMode.Duos ? 2 : 1);
		}

		// 2. For each player, remove units from the pool
		for (const {
			public_player_state: { units },
		} of Object.values(state.players)) {
			for (const { unit_id: unitID, rank } of units ?? []) {
				// exclude underlords from the pool calculations
				if (unitID < 1000) {
					// if rank == 1: -1
					// if rank == 2: -1 * 3
					// if rank == 3: -1 * 3 * 3

					state.pool[unitID] -= Math.pow(3, rank - 1);
				}
			}
		}

		return state;
	}
}
