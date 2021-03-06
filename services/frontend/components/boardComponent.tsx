import { MatchPlayer } from "definitions/match";
import React, { FunctionComponent, useState } from "react";
import { units } from "@shared/units";
import { currentSeason } from "@shared/season";
import Image from "next/image";
import { EquippedItemV8, ShareCodeV8 } from "underlords";
import { ItemSlot, Maybe, Unit } from "gql/Match.graphql";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

const cellCount = 8;
const rowCount = 8;

const currentSeasonUnits = units[currentSeason];

export interface BoardUnit {
	id: number;
	dota_unit_name: string;
	rank: number;
	item?: number;

	underlordID?: number;
	selectedTalents?: number[];
}

export const BoardComponent: FunctionComponent<{
	player?: MatchPlayer;
	personaName: string;
	opponent?: MatchPlayer;
	flip?: boolean;
	renderUnits?: boolean;
	opponentHealth?: number;
}> = React.memo(
	({
		player,
		personaName,
		opponent,
		flip = false,
		renderUnits = true,
		opponentHealth = 0,
	}) => {
		// --- Hooks ---
		const [buttonText, setButtonText] = useState("Copy share code");

		// --- UI variables ---
		const playerInfos = getBoardInfos(player);
		const opponentInfos = getBoardInfos(opponent);

		let indexedUnits: (BoardUnit | undefined)[][] = [];

		// Create empty 2d array
		for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
			indexedUnits[cellIndex] = [];

			for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
				indexedUnits[cellIndex][rowIndex] = undefined;
			}
		}

		// Fill indexed units array
		indexedUnits = populateIndexedArray(indexedUnits, playerInfos, flip);
		indexedUnits = populateIndexedArray(indexedUnits, opponentInfos, !flip);

		// --- Share code ---
		// Generate a share code using the 2d indexes units array
		const shareCode = new ShareCodeV8();

		for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
			for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
				const unit = indexedUnits[cellIndex][rowIndex];

				if (unit) {
					shareCode.boardUnitIDs[cellIndex][7 - rowIndex] =
						unit.id < 255 ? unit.id : 255;
					shareCode.unitRanks[cellIndex][7 - rowIndex] = unit.rank;

					if (unit.item) {
						shareCode.unitItems[cellIndex][
							7 - rowIndex
						] = new EquippedItemV8(unit.item);
					}

					// Underlords have a unit id of 1000+
					// yet the unitId field is a uint8
					// thus the board unit ID has to be set to 255 (max value)
					// indicating that this is a underlord that we're dealing with
					if (
						unit.id >= 1000 &&
						unit.underlordID &&
						unit.selectedTalents
					) {
						let index = 0;

						if (shareCode.underlordIDs[0]) {
							// If the first Underlord ID is already set
							index += 1;
						}

						shareCode.underlordIDs[index] = unit.underlordID;
						shareCode.underlordRanks[index] = unit.rank;

						// Selected talents are stored withing the 100k+ range,
						// thus subtracting 100k will yield the uint8 value
						// of the selected talents
						shareCode.selectedTalents[
							index
						] = unit.selectedTalents.map(
							(selectedTalent) => selectedTalent - 100000
						);
					}
				}
			}
		}

		return (
			<>
				<div style={{ marginLeft: "1em", paddingBottom: "1em" }}>
					{personaName} - {opponentHealth}{" "}
					<FontAwesomeIcon
						icon={faHeart}
						width="1em"
						height="1em"
						size="1x"
					/>
					{renderUnits && (
						<div style={{ float: "right", marginRight: "1em" }}>
							<button
								className="button is-primary"
								onClick={() =>
									navigator.clipboard
										.writeText(shareCode.toString())
										.then(() =>
											setButtonText(
												"Copied code to clipboard"
											)
										)
										.catch((reason) => {
											setButtonText("An error occured");
											console.error(reason);
										})
										.finally(() =>
											setTimeout(
												() =>
													setButtonText(
														"Copy share code"
													),
												1500
											)
										)
								}
								disabled={buttonText != "Copy share code"}
							>
								{buttonText}
							</button>
						</div>
					)}
				</div>
				<div className="box" style={{ margin: "1em" }}>
					<div
						style={{
							width: "100%",
							height: "100%",
							display: "flex",
							flexWrap: "wrap",
							overflow: "hidden",
						}}
					>
						{new Array(rowCount * cellCount)
							.fill(0)
							.map((_a, index) => {
								const cellIndex = index % 8;
								const rowIndex = (index - cellIndex) / 8;

								const unit = indexedUnits[cellIndex][rowIndex];

								return (
									<div
										key={`field_${index}`}
										style={{
											width: `${100 / 8}%`,
											background: "#1f2424",
											border: "1px #c7c9d3 solid",
											textAlign: "center",

											...(!unit
												? {
														paddingTop: `${
															100 / 16
														}%`,
														paddingBottom: `${
															100 / 16
														}%`,
												  }
												: {}),
										}}
									>
										{unit && renderUnits && (
											<UnitIcon
												dota_unit_name={
													unit.dota_unit_name
												}
											/>
										)}
									</div>
								);
							})}
					</div>
				</div>
			</>
		);
	}
);

const UnitIcon: FunctionComponent<{ dota_unit_name: string }> = ({
	dota_unit_name,
}) => (
	<figure className="image">
		<Image
			src={`/units/panorama/images/heroes/icons/${dota_unit_name}_png.png`}
			loading="lazy"
			width="64"
			height="64"
		/>
	</figure>
);

export interface BoardInfos {
	units: Maybe<Unit>[];
	itemSlots: ItemSlot[];
	underlordID: number;
	selectedTalents: number[];
}

const getBoardInfos = (player?: MatchPlayer): BoardInfos => {
	const units = player?.public_player_state?.units ?? [];
	const itemSlots = player?.public_player_state?.item_slots ?? [];
	const underlordID = player?.public_player_state?.underlord ?? 0;
	const selectedTalents = player?.public_player_state
		?.underlord_selected_talents ?? [0, 0];

	return {
		units,
		itemSlots,
		underlordID,
		selectedTalents,
	};
};

const populateIndexedArray = (
	indexedUnits: (BoardUnit | undefined)[][],
	playerBoardInfos: BoardInfos,
	flip: boolean = false
) => {
	// Fill indexed units array
	for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
		const rotatedCellIndex = 7 - cellIndex;

		for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
			const rotatedRowIndex = 7 - rowIndex;

			// Refactor this some time in the future, this is really ugly

			// Insert player units into 2d indexed array
			const unit = playerBoardInfos.units.find(
				(unit) =>
					unit?.position.x == cellIndex &&
					unit?.position.y == rowIndex
			);

			if (unit && unit.unit_id) {
				const item = playerBoardInfos.itemSlots.find(
					(itemSlot) =>
						itemSlot.assigned_unit_entindex == unit.entindex
				);

				const dota_unit_name =
					Object.values(currentSeasonUnits).find(
						({ id }) => id == unit.unit_id
					)?.dota_unit_name ?? "";

				const boardUnit: BoardUnit = {
					id: unit.unit_id,
					rank: unit.rank,
					dota_unit_name,
					item: item?.item_id,
				};

				if (boardUnit.id >= 1000) {
					boardUnit.underlordID = playerBoardInfos.underlordID;
					boardUnit.selectedTalents =
						playerBoardInfos.selectedTalents;
				}

				if (flip) {
					indexedUnits[rotatedCellIndex][rowIndex] = boardUnit;
				} else {
					indexedUnits[cellIndex][rotatedRowIndex] = boardUnit;
				}
			}
		}
	}

	return indexedUnits;
};
