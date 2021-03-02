import { MatchQuery } from "gql/Match.graphql";
import { currentSeason } from "@shared/season";
import { Unit, units } from "@shared/units";
import { poolSize } from "@shared/pool";

export const poolCalculations = (data?: MatchQuery) => {
	const pool: Record<string, number> =
		data?.match?.pool?.reduce<Record<string, number>>((acc, value) => {
			acc[value.index] = value.count;

			return acc;
		}, {}) ?? {};

	// Get units of the current rotation
	const currentUnits = units[currentSeason];

	// Map unit ids to their unit entry
	const mappedUnits = Object.entries(currentUnits).reduce<
		Record<string, Unit & { name: string }>
	>((acc, [name, unit]) => {
		if (unit.content_enable_group != "rotation" && unit.draftTier > 0) {
			acc[unit.id] = {
				id: unit.id,
				dota_unit_name: unit.dota_unit_name,
				draftTier: unit.draftTier,
				name,
			};
		}

		return acc;
	}, {});
	// Get draft tiers and units inside of these
	const draftTiers = Object.values(mappedUnits)
		.sort((a, b) => a.draftTier - b.draftTier)
		.reduce<Record<string, Array<Unit & { name: string }>>>(
			(acc, value) => {
				if (!acc[value.draftTier]) {
					acc[value.draftTier] = [];
				}

				acc[value.draftTier].push(value);

				return acc;
			},
			{}
		);

	// Calculate total pool size
	const totalPoolSize = Object.entries(draftTiers).reduce(
		(acc, [tier, units]) => {
			acc += poolSize[parseInt(tier)] * units.length;

			return acc;
		},
		0
	);

	// Calculate remaining units
	const remainingUnits = Object.values(mappedUnits)
		.sort((a, b) => a.id - b.id)
		.reduce((acc, { id }) => {
			const count = pool[id];

			if (count && Number.isInteger(count)) acc += count;

			return acc;
		}, 0);

	return {
		pool,
		currentUnits,
		mappedUnits,
		draftTiers,
		totalPoolSize,
		remainingUnits,
	};
};
