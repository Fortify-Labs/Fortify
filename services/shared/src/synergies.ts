import s1Dot5Synergies from "./assets/s1_5_synergies.json";

export interface SynergyLevel {
	id: number;
	unitcount: number;
	/**
	 * Either `"true"` or `"false"`
	 */
	affects_all_allied_units?: string;
}

export interface Synergy {
	/**
	 * "Race" | "Class"
	 */
	type: string;
	/**
	 * Indexed by "0", "1", "2", ...
	 */
	levels: SynergyLevel[];
}

// We'll keep the record definition on the variable to ensure type safety
const s1_5: Record<string, Synergy> = s1Dot5Synergies.set_balance;
export const synergies = {
	s1_5,
};
