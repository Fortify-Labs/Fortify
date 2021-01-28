import { injectable } from "inversify";
import {
	PrivatePlayerState,
	PublicPlayerState,
} from "@shared/definitions/gsiTypes";
import { EventService } from "@shared/services/eventService";
import { MatchState } from "@shared/state";
import { Logger } from "@shared/logger";
import {
	AllianceStatsEvent,
	CombinedStatsEvent,
	ItemStatsEvent,
	UnitStatsEvent,
} from "@shared/events/gameEvents";

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
		publicPlayerState: { synergies, units, item_slots },
		fightOutcome: wonFight,
		averageMMR = 0,
		timestamp,
	}: StateSourceData): UnitStatsEvent[] {
		const activeAlliances =
			synergies?.map((synergy) => synergy.keyword) ?? [];

		// First iteration of round number tracking
		const underlordRank =
			units?.find((unit) => unit.unit_id >= 1000)?.rank ?? 0;
		const estimatedRoundNumber =
			underlordRank >= 1 ? 5 + 5 * underlordRank : 0;

		return (
			units
				// This way only units that are on the board will be tracked
				?.filter((unit) => unit.position.y >= 0)
				.map(({ unit_id, entindex, rank }) => {
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
									itemSlot.assigned_unit_entindex ===
									entindex,
							)
							.map((itemSlot) => itemSlot.item_id) ?? [],
					);
					event.timestamp = new Date(timestamp);

					return event;
				}) ?? []
		);
	}

	private getAllianceStatsEvents({
		publicPlayerState: { synergies, units },
		fightOutcome: wonFight,
		averageMMR = 0,
		timestamp,
	}: StateSourceData): AllianceStatsEvent[] {
		const activeAlliances =
			synergies?.map((synergy) => synergy.keyword) ?? [];

		// First iteration of round number tracking
		const underlordRank =
			units?.find((unit) => unit.unit_id >= 1000)?.rank ?? 0;
		const estimatedRoundNumber =
			underlordRank >= 1 ? 5 + 5 * underlordRank : 0;

		return activeAlliances.map((alliance) => {
			const event = new AllianceStatsEvent(
				alliance,
				wonFight,
				estimatedRoundNumber,
				averageMMR,
				activeAlliances,
			);
			event.timestamp = new Date(timestamp);
			return event;
		});
	}

	private getItemStatsEvents({
		publicPlayerState: { synergies, item_slots, units },
		fightOutcome: wonFight,
		averageMMR = 0,
		timestamp,
	}: StateSourceData): ItemStatsEvent[] {
		const activeAlliances =
			synergies?.map((synergy) => synergy.keyword) ?? [];

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
					);
					event.timestamp = new Date(timestamp);
					return event;
				}) ?? []
		);
	}
}
