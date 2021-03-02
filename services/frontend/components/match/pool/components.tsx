import { MatchComponentProps, MatchPlayer } from "definitions/match";
import { GameMode, useMatchQuery } from "gql/Match.graphql";
import React, { FunctionComponent } from "react";
import { poolCalculations } from "utils/pool";
import { poolSize } from "@shared/pool";
import classNames from "classnames";
import { Unit, unitMappings } from "@shared/units";
import { VStack } from "components/vstack";
import Image from "next/image";
import { ShopOdds } from "@shared/calculations/consts";

export const PoolTiers: FunctionComponent<
	MatchComponentProps & {
		verticalLayout: boolean;
		compactView: boolean;
		selectedPlayer?: MatchPlayer | null;

		PoolTierComponent?: FunctionComponent<PoolTierComponentPros>;
		PoolUnitComponent?: FunctionComponent<PoolUnitComponentPros>;
	}
> = React.memo(
	({
		id,
		compactView,
		verticalLayout,
		PoolTierComponent = PoolTier,
		PoolUnitComponent = PoolUnit,
	}) => {
		const { data } = useMatchQuery({ variables: { id: id! } });

		// --- Pool Calculations ---
		const { draftTiers, pool } = poolCalculations(data);

		const gameMode = Object.entries(GameMode).find(
			([_key, mode]) => mode === data?.match?.mode
		)?.[0] as keyof ShopOdds;

		return (
			<>
				{Object.keys(draftTiers)
					.sort()
					.map((tier) => {
						return (
							<PoolTierComponent
								key={`tier-${tier}`}
								verticalLayout={verticalLayout}
								compactView={compactView}
								draftTiers={draftTiers}
								tier={tier}
								pool={pool}
								gameMode={gameMode}
								PoolUnitComponent={PoolUnitComponent}
							/>
						);
					})}
			</>
		);
	}
);

export interface PoolTierComponentPros {
	verticalLayout: boolean;
	compactView: boolean;

	gameMode: keyof ShopOdds;

	tier: string;
	pool: Record<string, number>;
	draftTiers: Record<
		string,
		(Unit & {
			name: string;
		})[]
	>;

	selectedPlayer?: MatchPlayer | null;

	PoolUnitComponent: FunctionComponent<PoolUnitComponentPros>;
}

export const PoolTier: FunctionComponent<PoolTierComponentPros> = React.memo(
	({
		tier,
		verticalLayout,
		compactView,
		pool,
		draftTiers,
		gameMode,
		PoolUnitComponent = PoolUnit,
	}) => {
		let left = 0;

		for (const unit of draftTiers[tier]) {
			if (pool[unit.id] && Number.isInteger(pool[unit.id])) {
				left += pool[unit.id] ?? 0;
			}
		}

		const total = draftTiers[tier].length * poolSize[parseInt(tier)];

		return (
			<div
				key={`unitTier-${tier}`}
				className={classNames("column", {
					"is-one-fifth": verticalLayout,
					"is-full": !verticalLayout,
				})}
			>
				<h4 className="title is-4">
					Tier {tier}: {left}/{total}
				</h4>
				<div className="columns is-multiline">
					{Object.values(draftTiers[tier])
						.map((unit) => ({
							...unit,
							name:
								unitMappings[unit.name]?.displayName ??
								unit.name,
						}))
						.sort((a, b) =>
							a.name < b.name ? -1 : a.name > b.name ? 1 : 0
						)
						.map((unit) => {
							const left = pool[unit.id] ?? 0;
							const total = poolSize[unit.draftTier];

							return (
								<PoolUnitComponent
									key={`pool-unit-${unit.id}`}
									unit={unit}
									left={left}
									total={total}
									compactView={compactView}
									gameMode={gameMode}
								/>
							);
						})}
				</div>
				<br />
			</div>
		);
	}
);

export interface PoolUnitComponentPros {
	unit: {
		id: number;
		name: string;
		dota_unit_name: string;
	};
	compactView: boolean;
	left: number;
	total: number;
	gameMode: keyof ShopOdds;
	selectedPlayer?: MatchPlayer | null;
}

const PoolUnit: FunctionComponent<PoolUnitComponentPros> = React.memo(
	({ unit, compactView, left, total }) => {
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
										margin: "auto",
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
								left > 0.7 * total
									? "green"
									: left > 0.4 * total
									? "yellow"
									: "red",
						}}
					>
						{left}/{total}
					</p>
				</VStack>
			</div>
		);
	}
);
