import { injectable } from "inversify";
import {
	PrivatePlayerState,
	PublicPlayerState,
	Synergy,
	Unit,
} from "@shared/definitions/gsiTypes";
import { EventService } from "@shared/services/eventService";
import { FortifyGameMode, MatchState } from "@shared/state";
import { Logger } from "@shared/logger";
import {
	ActiveAlliance,
	AllianceStatsEvent,
	CombinedStatsEvent,
	ExtraArgs,
	ItemStatsEvent,
	UnitStatsEvent,
} from "@shared/events/gameEvents";
import { EUnitKeyword } from "@shared/assets/keyword_mappings";
import { synergies } from "@shared/synergies";
import { currentSeason } from "../../../shared/src/season";

const { STATS_EVENTS_GENERATION_ENABLED = "true" } = process.env;

export interface StateUpdate<T = PublicPlayerState | PrivatePlayerState> {
	previous?: T;
	next: T;
	readonly matchState: MatchState;
	readonly timestamp: string;
}

export interface StateSourceData {
	publicPlayerState: PublicPlayerState;
	timestamp: string;
	/**
	 * `1` - win
	 * `0.5` - draw
	 * `0` - lost
	 */
	fightOutcome: number;
	averageMMR?: number;
	gameMode?: FortifyGameMode;
}

@injectable()
export class StateChangeHandler {
	constructor(public eventService: EventService, public logger: Logger) {}

	async updatedPublicPlayerState({
		previous,
		next,
		matchState,
		timestamp,
	}: StateUpdate<PublicPlayerState>) {
		if (
			previous &&
			(previous.combat_result !== null ||
				previous.combat_result !== undefined) &&
			(next.combat_result !== null || next.combat_result !== undefined)
		) {
			// A new combat_result has been detected

			const playerFightOutcome =
				next.combat_result === 0
					? 0.5
					: next.combat_result === 1
					? 1
					: // : next.combat_result === 2
					  // ? 0
					  0;

			const playerSourceData: StateSourceData = {
				publicPlayerState: next,
				fightOutcome: playerFightOutcome,
				averageMMR: matchState.averageMMR,
				gameMode: matchState.mode,
				timestamp,
			};
			// Track unit stats
			const playerUnitEvents = this.getUnitStatsEvents(playerSourceData);
			// Track alliance stats
			const playerAllianceStatsEvents = this.getAllianceStatsEvents(
				playerSourceData,
			);
			// Track item stats
			const playerItemStatsEvents = this.getItemStatsEvents(
				playerSourceData,
			);

			// Enable the stats generation by default
			// This has been added in case of an emergency disable
			if (STATS_EVENTS_GENERATION_ENABLED === "true") {
				// Send all events combined into one
				const combinedEvents = new CombinedStatsEvent(
					playerUnitEvents,
					playerItemStatsEvents,
					playerAllianceStatsEvents,
				);
				combinedEvents.timestamp = new Date(timestamp);
				await this.eventService.sendEvent(
					combinedEvents,
					`match-${matchState.id}`,
				);
			}
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async updatedPrivatePlayerState(args: StateUpdate<PrivatePlayerState>) {}

	private getUnitStatsEvents({
		publicPlayerState: {
			synergies: boardSynergies,
			units,
			item_slots,
			underlord_selected_talents,
		},
		fightOutcome: wonFight,
		averageMMR = 0,
		gameMode,
		timestamp,
	}: StateSourceData): UnitStatsEvent[] {
		const activeAlliances = this.getActiveAlliances(boardSynergies, units);

		// First iteration of round number tracking
		const underlordRank =
			units?.find((unit) => unit.unit_id >= 1000)?.rank ?? 0;
		const estimatedRoundNumber =
			underlordRank >= 1 ? 5 + 5 * underlordRank : 0;

		const unitStats = [];

		for (const { position, unit_id, entindex, rank } of units ?? []) {
			if (position.y >= 0) {
				let extra: ExtraArgs = {};

				// If the unit we're dealing with is a underlord
				if (unit_id > 1000) {
					extra = {
						underlordTalents: (
							underlord_selected_talents ?? []
						).map((talent) => talent - 100000),
					};
				}

				const event = new UnitStatsEvent(
					unit_id,
					rank,
					// value
					wonFight,
					// round number
					estimatedRoundNumber,
					averageMMR,
					activeAlliances,
					// Get equipped items
					item_slots
						?.filter(
							(itemSlot) =>
								itemSlot.assigned_unit_entindex === entindex,
						)
						.map((itemSlot) => itemSlot.item_id) ?? [],
					// Game mode
					gameMode,
					extra,
				);
				event.timestamp = new Date(timestamp);

				unitStats.push(event);
			}
		}

		return unitStats;
	}

	private getAllianceStatsEvents({
		publicPlayerState: { synergies: boardSynergies, units },
		fightOutcome: wonFight,
		averageMMR = 0,
		timestamp,
		gameMode,
	}: StateSourceData): AllianceStatsEvent[] {
		const activeAlliances = this.getActiveAlliances(boardSynergies, units);

		// First iteration of round number tracking
		const underlordRank =
			units?.find((unit) => unit.unit_id >= 1000)?.rank ?? 0;
		const estimatedRoundNumber =
			underlordRank >= 1 ? 5 + 5 * underlordRank : 0;

		return activeAlliances.map(({ id, level }) => {
			const event = new AllianceStatsEvent(
				id,
				wonFight,
				estimatedRoundNumber,
				averageMMR,
				activeAlliances,
				gameMode,
				{
					allianceLevel: level,
				},
			);
			event.timestamp = new Date(timestamp);
			return event;
		});
	}

	private getItemStatsEvents({
		publicPlayerState: { synergies: boardSynergies, item_slots, units },
		fightOutcome: wonFight,
		averageMMR = 0,
		timestamp,
		gameMode,
	}: StateSourceData): ItemStatsEvent[] {
		const activeAlliances = this.getActiveAlliances(boardSynergies, units);

		// First iteration of round number tracking
		const underlordRank =
			units?.find((unit) => unit.unit_id >= 1000)?.rank ?? 0;
		const estimatedRoundNumber =
			underlordRank >= 1 ? 5 + 5 * underlordRank : 0;

		return (
			item_slots
				?.filter(
					(itemSlot) =>
						itemSlot.assigned_unit_entindex !== null &&
						itemSlot.assigned_unit_entindex !== undefined,
				)
				.map((itemSlot) => {
					const event = new ItemStatsEvent(
						itemSlot.item_id,
						wonFight,
						estimatedRoundNumber,
						averageMMR,
						activeAlliances,
						gameMode,
					);
					event.timestamp = new Date(timestamp);
					return event;
				}) ?? []
		);
	}

	private getActiveAlliances(
		boardSynergies: Synergy[] | undefined,
		units: Unit[] | undefined,
	): ActiveAlliance[] {
		const synergyKeywords =
			boardSynergies?.map((synergy) => synergy.keyword) ?? [];
		const eUnitKeywords = synergyKeywords
			.map((synergyID) => ({
				synergyID,
				unitKeyword: EUnitKeyword[synergyID],
			}))
			.filter((synergy) => synergy.unitKeyword);
		const allSynergies = eUnitKeywords
			.map(({ synergyID, unitKeyword }) => ({
				synergyID,
				unitKeyword,
				synergy: synergies[currentSeason][unitKeyword],
			}))
			.filter((synergy) => synergy.synergy);

		const activeSynergies: ActiveAlliance[] = [];

		for (const { synergy, synergyID } of allSynergies) {
			// sort the array, so that the highest level comes first
			const levels = synergy.levels.sort(
				(a, b) => b.unitcount - a.unitcount,
			);

			// Get the unit count of units for the given synergy
			const unitCount =
				units?.filter((unit) => unit.keywords?.includes(synergyID))
					.length ?? 0;

			for (let index = 0; index < levels.length; index++) {
				const level = levels[index];

				// if the unit count is higher or equal to the current level requirement
				// insert it into the active synergies and break
				if (unitCount >= level.unitcount) {
					activeSynergies.push({
						id: synergyID,
						level: levels.length - index - 1,
					});
					break;
				}
			}
		}

		return activeSynergies;
	}
}
