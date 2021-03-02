import { GameMode, useMatchQuery } from "gql/Match.graphql";
import React, { FunctionComponent, useState } from "react";
import { VStack } from "components/vstack";
import Image from "next/image";
import classNames from "classnames";
import { poolCalculations } from "utils/pool";
import { unitMappings } from "@shared/units";
import { createPoolLayoutDropdown } from "components/poolLayoutDropdown";
import { odds, ShopOdds } from "@shared/calculations/consts";
import { MatchComponentProps } from "definitions/match";
import { PlayerSelectionDropdown } from "components/playerSelectionDropdown";

export const OddsCalculator: FunctionComponent<MatchComponentProps> = ({
	id,
}) => {
	// --- Data fetching ---
	const { data } = useMatchQuery({ variables: { id } });

	// --- Variables ---
	const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

	const gameMode = Object.entries(GameMode).find(
		([_key, mode]) => mode === data?.match?.mode
	)?.[0] as keyof ShopOdds;

	// --- Dynamic UI components ---
	const {
		PoolLayoutDropdown,
		verticalLayout,
		compactView,
		gapLess,
	} = createPoolLayoutDropdown();

	// --- Pool Calculations ---
	const { draftTiers, pool } = poolCalculations(data);

	return (
		<div className="content">
			<div>
				<PlayerSelectionDropdown
					selectedPlayer={selectedPlayer}
					setSelectedPlayer={setSelectedPlayer}
					id={id}
				/>

				<PoolLayoutDropdown />
			</div>

			{
				// Odds pool view
			}
			<div
				className={classNames("columns is-multiline", {
					"is-gapless": gapLess,
				})}
				style={{ overflowY: "scroll", marginTop: "1em" }}
			>
				{Object.keys(draftTiers).map((tier) => {
					let leftInTier = 0;

					for (const unit of draftTiers[tier]) {
						if (pool[unit.id] && Number.isInteger(pool[unit.id])) {
							leftInTier += pool[unit.id] ?? 0;
						}
					}

					return (
						<div
							key={`unitTier-${tier}`}
							className={classNames("column", {
								"is-one-fifth": verticalLayout,
								"is-full": !verticalLayout,
							})}
						>
							<h4 className="title is-4">Tier {tier}</h4>
							<div className="columns is-multiline">
								{
									// Render all units in tier
								}
								{Object.values(draftTiers[tier])
									.map((unit) => ({
										...unit,
										name:
											unitMappings[unit.name]
												?.displayName ?? unit.name,
									}))
									// Sort in tier units alphabetically
									.sort((a, b) =>
										a.name < b.name
											? -1
											: a.name > b.name
											? 1
											: 0
									)
									.map((unit) => {
										const left = pool[unit.id] ?? 0;
										const tierOdds =
											odds?.[gameMode]?.[
												data?.match?.players?.find(
													(player) =>
														player.id ==
														selectedPlayer
												)?.public_player_state?.level ??
													0
											]?.[tier] ?? 0;
										const unitOddsOneDraw =
											(tierOdds * left) /
											// leftInTier is ored with a one to avoid division by zero
											(leftInTier || 1);

										// TODO: Implement blacklisting

										// Chances not to draw in one is: 1 - unitOddsOneDraw
										// Chances to draw in one is: 1 - "Chances not to draw"

										// Thus the chance to draw in 5 draws is equal to the chance
										// not to draw in 5 subtracted from one

										// Unit odds in n draws := 1 - (1 - unitDrawOdds)^(n)
										const unitOdds =
											1 -
											Math.pow(1 - unitOddsOneDraw, 5);

										return (
											<div
												className="column is-narrow"
												key={`unit-${unit.id}`}
												style={{
													whiteSpace: "pre-wrap",
													wordWrap: "break-word",
												}}
											>
												<VStack
													style={{
														textAlign: "center",
													}}
												>
													<figure
														className="image is-64x64"
														style={
															compactView
																? {
																		margin:
																			"auto",
																  }
																: {}
														}
													>
														<Image
															className="is-rounded"
															src={`/units/panorama/images/heroes/icons/${unit.dota_unit_name}_png.png`}
															loading="lazy"
															width="64"
															height="64"
														/>
													</figure>
													{unit.name} <br />
													<p
														style={{
															color:
																unitOdds >= 0.1
																	? "green"
																	: unitOdds >=
																	  0.03
																	? "white"
																	: "red",
														}}
													>
														{Math.floor(
															unitOdds * 1000
														) / 10}
														%{" "}
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
	);
};
