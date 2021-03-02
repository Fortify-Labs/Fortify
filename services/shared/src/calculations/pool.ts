import { Unit, units } from "../units";
import { currentSeason } from "../season";
import { FortifyGameMode } from "../state";
import { poolSize } from "../pool";

export const unitsLeftInPool = ({
	pool,
	mode,
	season = currentSeason,
	unitCodeName,
	unitID,
}: {
	pool: Record<number, number>;
	mode: FortifyGameMode;
	unitID?: number;
	unitCodeName?: string;
	season?: keyof typeof units;
}) => {
	if (!(unitID || unitCodeName)) {
		throw new Error("No unit id or code name has been passed");
	}

	if (!pool) {
		throw new Error("Could not find a unit pool in given match state");
	}

	if (!Object.keys(units).includes(season)) {
		throw new Error(`Season ${season} not included in units definition`);
	}

	const seasonalUnits = units[season as keyof typeof units];

	let unit: Unit | undefined;

	if (unitCodeName) {
		unit = seasonalUnits[unitCodeName] as Unit | undefined;
	}

	if (unitID) {
		unit = Object.values(seasonalUnits).find((unit) => unit.id === unitID);
	}

	if (!unit || unit.id >= 1000) {
		throw new Error(`No unit found for ${unitCodeName} (${unitID})`);
	}

	const { id, draftTier } = unit;

	const left = pool[id];

	const total =
		(poolSize[draftTier] ?? 0) *
		// The total pool size is doubled in duos
		(mode === FortifyGameMode.Duos ? 2 : 1);

	return { left, total };
};

export const unitsLeftInTier = ({
	pool,
	mode,
	tier,
	season = currentSeason,
}: {
	pool: Record<number, number>;
	mode: FortifyGameMode;
	tier: number;
	season?: keyof typeof units;
}) => {
	if (!pool) {
		throw new Error("Could not find a unit pool in given match state");
	}

	if (!Object.keys(units).includes(season)) {
		throw new Error(`Season ${season} not included in units definition`);
	}

	const seasonalUnits = units[season as keyof typeof units];

	const draftTiers = Object.values(seasonalUnits).reduce<
		Record<string, Array<Unit>>
	>((acc, value) => {
		if (!acc[value.draftTier]) {
			acc[value.draftTier] = [];
		}

		acc[value.draftTier].push(value);

		return acc;
	}, {});

	const left = Object.values(draftTiers[tier])
		.map((unit) => unit.id)
		.reduce((acc, id) => {
			if (pool[id] && Number.isInteger(pool[id])) {
				acc += pool[id] ?? 0;
			}

			return acc;
		}, 0);

	const total =
		draftTiers[tier].length *
		poolSize[tier] *
		(mode === FortifyGameMode.Duos ? 2 : 1);

	return { left, total };
};
