import { injectable, inject } from "inversify";
import {
	GameEventType,
	MatchStartedEvent,
	MatchFinalPlaceEvent,
	MatchEndedEvent,
	RankTierUpdateEvent,
	SmurfDetectedEvent,
	AllianceStatsEvent,
	ItemStatsEvent,
	UnitStatsEvent,
	CombinedStatsEvent,
} from "@shared/events/gameEvents";
import { FortifyEvent } from "@shared/events/events";
import { MatchService } from "@shared/services/match";
import { PostgresConnector } from "@shared/connectors/postgres";
import { rankToMMRMapping } from "@shared/ranks";
import { MMR, User } from "@shared/db/entities/user";
import { FortifyGameMode } from "@shared/state";
import { Logger } from "@shared/logger";
import { UnitStats, SynergyStats, ItemStats } from "@shared/db/entities/stats";
import { MmrStats } from "@shared/db/entities/mmr";

@injectable()
export class MatchPersistor {
	constructor(
		@inject(MatchService) private matchService: MatchService,
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(Logger) private logger: Logger,
	) {}

	async handleEvent(event: FortifyEvent<GameEventType>) {
		try {
			if (event.type === GameEventType.MATCH_STARTED) {
				const startedEvent = MatchStartedEvent.deserialize(event);
				return this.startHandler(startedEvent);
			}
			if (event.type === GameEventType.FINAL_PLACE) {
				const finalPlaceEvent = MatchFinalPlaceEvent.deserialize(event);
				return this.finalPlaceHandler(finalPlaceEvent);
			}
			if (event.type === GameEventType.MATCH_ENDED) {
				const endedEvent = MatchEndedEvent.deserialize(event);
				return this.endedHandler(endedEvent);
			}
			if (event.type === GameEventType.RANK_TIER_UPDATE) {
				const rankTierUpdateEvent = RankTierUpdateEvent.deserialize(
					event,
				);
				return this.updateRankTier(rankTierUpdateEvent);
			}

			if (event.type === GameEventType.SMURF_DETECTED) {
				const smurfEvent = SmurfDetectedEvent.deserialize(event);
				return this.storeSmurfEvent(smurfEvent);
			}

			if (event.type === GameEventType.ALLIANCE_STATS) {
				const allianceStatsEvent = AllianceStatsEvent.deserialize(
					event,
				);

				const synergyStats = this.mapAllianceStats(allianceStatsEvent);
				const synergyStatsRepo = this.postgres.getSynergyStatsRepo();

				return synergyStatsRepo.save(synergyStats);
			}
			if (event.type === GameEventType.ITEM_STATS) {
				const itemStatsEvent = ItemStatsEvent.deserialize(event);

				const itemStats = this.mapItemStats(itemStatsEvent);
				const itemStatsRepo = this.postgres.getItemStatsRepo();

				return itemStatsRepo.save(itemStats);
			}
			if (event.type === GameEventType.UNIT_STATS) {
				const unitStatsEvent = UnitStatsEvent.deserialize(event);

				const unitStats = this.mapUnitStats(unitStatsEvent);
				const unitStatsRepo = this.postgres.getUnitStatsRepo();

				return unitStatsRepo.save(unitStats);
			}

			if (event.type === GameEventType.COMBINED_STATS) {
				const combinedStats = CombinedStatsEvent.deserialize(event);

				const allianceStats = combinedStats.allianceStatsEvents.map(
					(allianceStatsEvent) =>
						this.mapAllianceStats(allianceStatsEvent),
				);
				const itemStats = combinedStats.itemStatsEvents.map(
					(itemStatsEvent) => this.mapItemStats(itemStatsEvent),
				);
				const unitStats = combinedStats.unitStatsEvents.map(
					(unitStatsEvent) => this.mapUnitStats(unitStatsEvent),
				);

				return Promise.allSettled([
					this.postgres.getSynergyStatsRepo().save(allianceStats),
					this.postgres.getItemStatsRepo().save(itemStats),
					this.postgres.getUnitStatsRepo().save(unitStats),
				]);
			}
		} catch (e) {
			this.logger.error("An error occurred in the match persistor", {
				e,
				event,
			});
			this.logger.error(e, {
				event,
			});
			throw e;
		}
	}

	mapUnitStats({
		activeAlliances,
		averageMMR,
		equippedItems,
		rank,
		roundNumber,
		timestamp,
		unitID,
		value,
		gameMode,
		extra,
	}: UnitStatsEvent): UnitStats {
		const stat = new UnitStats();

		stat.activeAlliances = [];
		stat.averageMMR = averageMMR;
		stat.gameMode = gameMode;
		stat.id = unitID;
		stat.items = equippedItems;
		stat.rank = rank;
		stat.round = roundNumber;
		stat.time = timestamp;
		stat.underlordTalent = extra?.underlordTalents;
		stat.win = value;

		for (const { id, level } of activeAlliances.sort(
			(a, b) => a.id - b.id,
		)) {
			if (
				id !== null &&
				id !== undefined &&
				level !== null &&
				level !== undefined
			) {
				stat.activeAlliances.push({
					id,
					level,
				});
			}
		}

		return stat;
	}

	mapItemStats({
		activeAlliances,
		averageMMR,
		itemID,
		roundNumber,
		timestamp,
		value,
		gameMode,
	}: ItemStatsEvent): ItemStats {
		const stat = new ItemStats();

		stat.activeAlliances = [];
		stat.averageMMR = averageMMR;
		stat.gameMode = gameMode;
		stat.id = itemID;
		stat.round = roundNumber;
		stat.time = timestamp;
		stat.win = value;

		for (const { id, level } of activeAlliances.sort(
			(a, b) => a.id - b.id,
		)) {
			if (
				id !== null &&
				id !== undefined &&
				level !== null &&
				level !== undefined
			) {
				stat.activeAlliances.push({ id, level });
			}
		}

		return stat;
	}

	mapAllianceStats({
		activeAlliances,
		allianceID,
		averageMMR,
		roundNumber,
		timestamp,
		value,
		gameMode,
		extra,
	}: AllianceStatsEvent): SynergyStats {
		const stat = new SynergyStats();

		stat.activeAlliances = [];
		stat.averageMMR = averageMMR;
		stat.gameMode = gameMode;
		stat.id = allianceID;
		stat.round = roundNumber;
		stat.time = timestamp;
		stat.win = value;
		stat.rank = extra?.allianceLevel;

		for (const { id, level } of activeAlliances.sort(
			(a, b) => a.id - b.id,
		)) {
			if (
				id !== null &&
				id !== undefined &&
				level !== null &&
				level !== undefined
			) {
				stat.activeAlliances.push({ id, level });
			}
		}

		return stat;
	}

	async startHandler(startedEvent: MatchStartedEvent) {
		return this.matchService.storeMatchStart(startedEvent);
	}

	async finalPlaceHandler(finalPlaceEvent: MatchFinalPlaceEvent) {
		return this.matchService.storeFinalPlace(finalPlaceEvent);
	}

	async endedHandler(endedEvent: MatchEndedEvent) {
		return this.matchService.storeMatchEnd(endedEvent);
	}

	async updateRankTier({
		accountID,
		rankTier,
		mode,
		timestamp,
	}: RankTierUpdateEvent) {
		const userRepo = await this.postgres.getUserRepo();
		let user = await userRepo.findOne(accountID);

		if (!user) {
			user = new User();
			user.steamid = accountID;
			user.name = "";
		}

		if (mode === FortifyGameMode.Normal) {
			user.standardRating = { ...user.standardRating, rankTier };
		} else if (mode === FortifyGameMode.Turbo) {
			user.turboRating = { ...user.turboRating, rankTier };
		} else if (mode === FortifyGameMode.Duos) {
			user.duosRating = { ...user.duosRating, rankTier };
		}

		await userRepo.save(user);

		// Convert all rank tiers below Lord to mmr
		if (rankTier < 80) {
			// Insert interpolated mmr into influxdb
			const minorRank = rankTier % 10;
			const majorRank = (rankTier - minorRank) / 10;

			const mmr = rankToMMRMapping[majorRank][minorRank];

			const mmrStat = new MmrStats();

			mmrStat.mmr = mmr;
			mmrStat.rank = 0;
			mmrStat.time = timestamp;
			mmrStat.type = mode as number;
			mmrStat.user = user;

			const mmrStatsRepo = this.postgres.getMmrStatsRepo();
			await mmrStatsRepo.save(mmrStat);

			// Store interpolate mmr into postgres
			const ratings: MMR = {
				rankTier,
				mmr,
				rank: 0,
			};
			if (mode === FortifyGameMode.Normal) {
				user.standardRating = ratings;
			} else if (mode === FortifyGameMode.Turbo) {
				user.turboRating = ratings;
			} else if (mode === FortifyGameMode.Duos) {
				user.duosRating = ratings;
			}

			await userRepo.save(user);
		}
	}

	async storeSmurfEvent(smurfEvent: SmurfDetectedEvent) {
		const userRepo = await this.postgres.getUserRepo();

		const { smurfAccountID, mainAccountID, timestamp } = smurfEvent;

		const mainAccount = await userRepo.findOneOrFail(mainAccountID);
		let smurfAccount = await userRepo.findOne(smurfAccountID);

		if (!smurfAccount) {
			smurfAccount = new User();
			smurfAccount.steamid = smurfAccountID;
			smurfAccount.created = timestamp;
			smurfAccount.name = smurfAccountID;
			smurfAccount.updated = timestamp;
		}

		smurfAccount.mainAccount = mainAccount;

		return userRepo.save(smurfAccount);
	}
}
