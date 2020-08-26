import { FunctionComponent } from "react";

import { useLobbyPoolQuery } from "gql/LobbyPool.graphql";

import { currentSeason, units, Unit, unitMappings } from "@shared/units";
import { poolSize } from "@shared/pool";
import { VStack } from "components/vstack";

export const PoolViewer: FunctionComponent<{ id?: string }> = ({ id }) => {
	const { data, loading, error } = useLobbyPoolQuery({ variables: { id } });
	const pool: Record<string, number | undefined> = JSON.parse(
		data?.lobby?.pool ?? "{}"
	);

	const currentUnits = units[currentSeason];
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
	const draftTiers = Object.values(mappedUnits).reduce<
		Record<string, Array<Unit & { name: string }>>
	>((acc, value) => {
		if (!acc[value.draftTier]) acc[value.draftTier] = [];
		acc[value.draftTier].push(value);

		return acc;
	}, {});

	const totalPoolSize = Object.entries(draftTiers).reduce(
		(acc, [tier, units]) => {
			acc += poolSize[parseInt(tier)] * units.length;

			return acc;
		},
		0
	);

	const remainingUnits = Object.values(mappedUnits).reduce((acc, { id }) => {
		const count = pool[id];

		if (count && Number.isInteger(count)) acc += count;

		return acc;
	}, 0);

	return (
		<>
			{error && (
				<p style={{ margin: "1rem" }}>
					{error.name} - {error.message}
				</p>
			)}

			{loading && <p>Loading...</p>}

			{!loading && (
				<div className="content">
					<h4 className="title is-4" style={{ margin: "1rem" }}>
						Total Pool Size: {remainingUnits}/{totalPoolSize}
					</h4>{" "}
					<div
						className="columns is-multiline"
						style={{ margin: "1rem" }}
					>
						{Object.keys(draftTiers).map((tier) => {
							const left = Object.values(draftTiers[tier])
								.map((unit) => unit.id)
								.reduce((acc, id) => {
									if (pool[id] && Number.isInteger(pool[id]))
										acc += pool[id] ?? 0;

									return acc;
								}, 0);
							const total =
								draftTiers[tier].length *
								poolSize[parseInt(tier)];

							return (
								<div key={`unitTier-${tier}`}>
									<h4 className="title is-4">
										Tier {tier}: {left}/{total}
									</h4>
									<div className="columns is-multiline">
										{Object.values(draftTiers[tier])
											.map((unit) => ({
												...unit,
												name:
													unitMappings[unit.name]
														?.displayName ??
													unit.name,
											}))
											.sort((a, b) =>
												a.name < b.name
													? -1
													: a.name > b.name
													? 1
													: 0
											)
											.map((unit) => {
												const left = pool[unit.id] ?? 0;
												const total =
													poolSize[unit.draftTier];

												return (
													<div
														className="column is-narrow"
														key={`unit-${unit.id}`}
													>
														<VStack
															style={{
																textAlign:
																	"center",
															}}
														>
															<figure
																className="image is-64x64"
																style={{
																	margin:
																		"auto",
																}}
															>
																<img
																	className="is-rounded"
																	src={`/units/panorama/images/heroes/icons/${unit.dota_unit_name}_png.png`}
																	// src="https://bulma.io/images/placeholders/128x128.png"
																/>
															</figure>
															{unit.name} <br />
															<p
																style={{
																	color:
																		left >
																		0.7 *
																			total
																			? "green"
																			: left >
																			  0.4 *
																					total
																			? "yellow"
																			: "red",
																}}
															>
																{left}/{total}
															</p>
														</VStack>
													</div>
												);
											})}
									</div>
									<br />
								</div>
							);
						})}
					</div>
				</div>
			)}
		</>
	);
};
