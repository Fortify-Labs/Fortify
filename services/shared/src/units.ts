import s1Units from "./assets/s1_units.json";
import aliases from "./assets/unit_mappings.json";

export interface Unit {
	id: number;
	draftTier: number;
	dota_unit_name: string;
	content_enable_group?: string;
}

export const currentSeason = "s1";

// We'll keep the record definition on the variable to ensure type safety
const s1: Record<string, Unit> = s1Units.set_balance;
export const units = {
	s1,
};

export interface UnitMapping {
	displayName: string;
	alts: string[];
}

export const unitMappings: Record<string, UnitMapping> = aliases;
