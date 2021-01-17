import { injectable, inject } from "inversify";
import {
	GameEventType,
	MatchStartedEvent,
	MatchFinalPlaceEvent,
	MatchEndedEvent,
	RankTierUpdateEvent,
	SmurfDetectedEvent,
} from "@shared/events/gameEvents";
import { FortifyEvent } from "@shared/events/events";
import { MatchService } from "@shared/services/match";
import { PostgresConnector } from "@shared/connectors/postgres";
import { InfluxDBConnector } from "@shared/connectors/influxdb";
import { Point } from "@influxdata/influxdb-client";
import { rankToMMRMapping } from "@shared/ranks";
import { MMR, User } from "@shared/db/entities/user";
import { FortifyGameMode } from "@shared/state";
import { LeaderboardType } from "@shared/definitions/leaderboard";
import { Logger } from "@shared/logger";

@injectable()
export class MatchPersistor {
	constructor(
		@inject(MatchService) private matchService: MatchService,
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(InfluxDBConnector) private influx: InfluxDBConnector,
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
		} catch (e) {
			this.logger.error("An error occurred in the match persistor", {
				e,
				event,
			});
			this.logger.error(e, {
				event,
			});
		}
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

	async updateRankTier({ accountID, rankTier, mode }: RankTierUpdateEvent) {
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

			const points = [
				new Point("mmr")
					.intField("mmr", mmr)
					.intField("rank", 0)
					.tag("steamid", accountID)
					.tag(
						"type",
						mode === FortifyGameMode.Normal
							? LeaderboardType.Standard
							: mode === FortifyGameMode.Turbo
							? LeaderboardType.Turbo
							: mode === FortifyGameMode.Duos
							? LeaderboardType.Duos
							: FortifyGameMode[mode],
					),
			];

			await this.influx.writePoints(points);

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
