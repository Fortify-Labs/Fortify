import { injectable } from "inversify";
import { FortifyPlayerState } from "@shared/state";
import { poolSize } from "@shared/pool";

import { Unit } from "../gsiTypes";

// import unitsJSON from "../../assets/units.json";
import unitsJSON from "../assets/s1_units.json";
const unitEntries = Object.entries(unitsJSON);
export type unitEntryType = typeof unitEntries[1];

@injectable()
export class PoolCalculatorService {
	private mappedUnits: Record<number, unitEntryType>;

	constructor() {
		this.mappedUnits = unitEntries.reduce<Record<number, unitEntryType>>(
			(acc, entry) => {
				acc[entry[1].id] = entry;

				return acc;
			},
			{},
		);
	}

	mapPlayerUnits(units: Unit[]) {
		return units.map(({ unit_id, rank }) => ({
			draftTier: this.mappedUnits[unit_id]
				? this.mappedUnits[unit_id][1].draftTier
				: -1,
			rank,
			unitID: unit_id,
		}));
	}

	calculatePublicPool(state: FortifyPlayerState) {
		// --- Pool calculations ---

		// The pool calculations will be (re-)done every time a a new public player state is received
		const pool: Record<number, number> = {};

		// 1. Reset the unit pool counts
		for (const [, { id, draftTier }] of Object.values(this.mappedUnits)) {
			pool[id] = poolSize[draftTier] ?? 0;
		}

		// 2. For each player, remove units from the pool
		for (const { units } of Object.values(state.lobby.players)) {
			for (const { unitID, rank } of units ?? []) {
				// if rank == 1: -1
				// if rank == 2: -1 * 3
				// if rank == 3: -1 * 3 * 3

				pool[unitID] -= -1 * Math.pow(3, rank - 1);
			}
		}

		state.lobby.pool = pool;

		return state;
	}
}
