import s1Units from "./assets/s1_units.json";
import s1Dot5Units from "./assets/s1_5_units.json";
import aliases from "./assets/unit_mappings.json";

export interface Unit {
	id: number;
	draftTier: number;
	dota_unit_name: string;
	content_enable_group?: string;
}

// We'll keep the record definition on the variable to ensure type safety
const s1: Record<string, Unit> = s1Units.set_balance;
const s1_5: Record<string, Unit> = s1Dot5Units.set_balance;
export const units = {
	s1,
	s1_5,
};

export interface UnitMapping {
	displayName: string;
	alts: string[];
}

export const unitMappings: Record<string, UnitMapping> = aliases;
