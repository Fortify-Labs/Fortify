import s1UnitsJson from "./assets/s1_units.json";

export interface Unit {
	id: number;
	draftTier: number;
}

export const S1Units: Record<string, Unit> = s1UnitsJson;
