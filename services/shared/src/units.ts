import s1UnitsJson from "./assets/s1_units.json";
import aliases from "./assets/unit_mappings.json";

export interface Unit {
	id: number;
	draftTier: number;
}

export const S1Units: Record<string, Unit> = s1UnitsJson;
export const unitMappings: Record<string, string[]> = aliases;
