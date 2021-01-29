import {
	FortifyEventClass,
	FortifyEventTopics,
	FortifyEvent,
	DeserializationError,
} from "./events";
import { MatchServicePlayer } from "../services/match";
import { FortifyGameMode } from "../state";

export enum GameEventType {
	UNKNOWN,
	MATCH_STARTED,
	FINAL_PLACE,
	MATCH_ENDED,
	RANK_TIER_UPDATE,
	SMURF_DETECTED,
	UNIT_STATS,
	ITEM_STATS,
	ALLIANCE_STATS,
	COMBINED_STATS,
}

export class GameEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.UNKNOWN;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		return new this();
	}
}

export class MatchStartedEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.MATCH_STARTED;

	constructor(
		public matchID: string,
		public players: readonly MatchServicePlayer[],
		public gameMode: FortifyGameMode,
	) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		const matchID = obj["matchID"] as string | null;
		const players = obj["players"] as MatchServicePlayer[] | null;
		const gameMode = obj["gameMode"] as FortifyGameMode | null;
		const timestamp = obj["timestamp"] as string | null;

		if (matchID && players && gameMode && timestamp) {
			const mse = new this(matchID, players, gameMode);
			mse.timestamp = new Date(timestamp);
			return mse;
		} else throw new DeserializationError();
	}
}

export class MatchFinalPlaceEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.FINAL_PLACE;

	constructor(
		public matchID: string,
		public steamID: string,
		public finalPlace: number,
	) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		const matchID = obj["matchID"] as string | null;
		const steamID = obj["steamID"] as string | null;
		const finalPlace = obj["finalPlace"] as number | null;
		const timestamp = obj["timestamp"] as string | null;

		if (matchID && steamID && !!finalPlace && timestamp) {
			const mfpe = new this(matchID, steamID, finalPlace);
			mfpe.timestamp = new Date(timestamp);
			return mfpe;
		} else throw new DeserializationError();
	}
}

export class MatchEndedEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.MATCH_ENDED;

	constructor(public matchID: string) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		const matchID = obj["matchID"] as string | null;
		const timestamp = obj["timestamp"] as string | null;

		if (matchID && timestamp) {
			const mee = new this(matchID);
			mee.timestamp = new Date(timestamp);

			return mee;
		} else throw new DeserializationError();
	}
}

export class RankTierUpdateEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.RANK_TIER_UPDATE;

	constructor(
		public accountID: string,
		public rankTier: number,
		public mode: FortifyGameMode,
	) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		const accountID = obj["accountID"] as string | null;
		const rankTier = obj["rankTier"] as number | null;
		const mode = obj["mode"] as FortifyGameMode | null;

		if (accountID && !!rankTier && mode)
			return new this(accountID, rankTier, mode);
		else throw new DeserializationError();
	}
}

export class SmurfDetectedEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.SMURF_DETECTED;

	constructor(public mainAccountID: string, public smurfAccountID: string) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		// TODO: Delete line after a release or two
		const originalAccountID = obj["originalAccountID"] as string | null;
		const mainAccountID = obj["mainAccountID"] as string | null;
		const smurfAccountID = obj["smurfAccountID"] as string | null;

		if ((originalAccountID || mainAccountID) && smurfAccountID)
			return new this(
				mainAccountID ?? originalAccountID!,
				smurfAccountID,
			);
		else throw new DeserializationError();
	}
}

export interface ExtraArgs {
	underlordTalents?: number[];
}

export class UnitStatsEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.UNIT_STATS;

	constructor(
		public unitID: number,
		public rank: number,
		/**
		 * `1` - if unit won a fight
		 * `0.5` - if a unit tied a fight
		 * `0` - if unit lost a fight
		 */
		public value: number,
		public roundNumber: number,
		public averageMMR: number,
		public activeAlliances: number[],
		public equippedItems: number[],
		public gameMode: FortifyGameMode = FortifyGameMode.Invalid,
		public extra?: ExtraArgs,
	) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		const unitID = obj["unitID"] as number;
		const rank = obj["rank"] as number;
		const value = obj["value"] as number;
		const roundNumber = obj["roundNumber"] as number;
		const averageMMR = obj["averageMMR"] as number;
		const activeAlliances = obj["activeAlliances"] as number[];
		const equippedItems = obj["equippedItems"] as number[];
		const gameMode = obj["gameMode"] as FortifyGameMode;
		const extra = obj["extra"] as ExtraArgs | undefined;

		// A check for not null & undefined is required, as JS would convert a zero to false
		if (
			unitID !== null &&
			unitID !== undefined &&
			rank !== null &&
			rank !== undefined &&
			value !== null &&
			value !== undefined &&
			roundNumber !== null &&
			roundNumber !== undefined &&
			averageMMR !== null &&
			averageMMR !== undefined &&
			activeAlliances &&
			equippedItems
		) {
			return new this(
				unitID,
				rank,
				value,
				roundNumber,
				averageMMR,
				activeAlliances,
				equippedItems,
				gameMode,
				extra,
			);
		} else throw new DeserializationError();
	}
}

export class ItemStatsEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.ITEM_STATS;

	constructor(
		public itemID: number,
		/**
		 * `1` - if an item won a fight
		 * `0.5` - if an item tied a fight
		 * `0` - if an item lost a fight
		 */
		public value: number,
		public roundNumber: number,
		public averageMMR: number,
		public activeAlliances: number[],
		public gameMode: FortifyGameMode = FortifyGameMode.Invalid,
	) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		const itemID = obj["itemID"] as number;
		const value = obj["value"] as number;
		const roundNumber = obj["roundNumber"] as number;
		const averageMMR = obj["averageMMR"] as number;
		const activeAlliances = obj["activeAlliances"] as number[];
		const gameMode = obj["gameMode"] as FortifyGameMode;

		// A check for not null & undefined is required, as JS would convert a zero to false
		if (
			itemID !== null &&
			itemID !== undefined &&
			value !== null &&
			value !== undefined &&
			roundNumber !== null &&
			roundNumber !== undefined &&
			averageMMR !== null &&
			averageMMR !== undefined &&
			activeAlliances
		) {
			return new this(
				itemID,
				value,
				roundNumber,
				averageMMR,
				activeAlliances,
				gameMode,
			);
		} else throw new DeserializationError();
	}
}

export class AllianceStatsEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.ALLIANCE_STATS;

	constructor(
		public allianceID: number,
		/**
		 * `1` - if an alliance won a fight
		 * `0.5` - if an alliance tied a fight
		 * `0` - if an alliance lost a fight
		 */
		public value: number,
		public roundNumber: number,
		public averageMMR: number,
		public activeAlliances: number[],
		public gameMode: FortifyGameMode = FortifyGameMode.Invalid,
	) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		const allianceID = obj["allianceID"] as number;
		const value = obj["value"] as number;
		const roundNumber = obj["roundNumber"] as number;
		const averageMMR = obj["averageMMR"] as number;
		const activeAlliances = obj["activeAlliances"] as number[];
		const gameMode = obj["gameMode"] as FortifyGameMode;

		// A check for not null & undefined is required, as JS would convert a zero to false
		if (
			allianceID !== null &&
			allianceID !== undefined &&
			value !== null &&
			value !== undefined &&
			roundNumber !== null &&
			roundNumber !== undefined &&
			averageMMR !== null &&
			averageMMR !== undefined &&
			activeAlliances
		) {
			return new this(
				allianceID,
				value,
				roundNumber,
				averageMMR,
				activeAlliances,
				gameMode,
			);
		} else throw new DeserializationError();
	}
}

export class CombinedStatsEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.COMBINED_STATS;

	constructor(
		public unitStatsEvents: UnitStatsEvent[],
		public itemStatsEvents: ItemStatsEvent[],
		public allianceStatsEvents: AllianceStatsEvent[],
	) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		const unitStatsEvents = obj["unitStatsEvents"] as UnitStatsEvent[];
		const itemStatsEvents = obj["itemStatsEvents"] as ItemStatsEvent[];
		const allianceStatsEvents = obj[
			"allianceStatsEvents"
		] as AllianceStatsEvent[];

		// A check for not null & undefined is required, as JS would convert a zero to false
		if (
			unitStatsEvents !== null &&
			unitStatsEvents !== undefined &&
			itemStatsEvents !== null &&
			itemStatsEvents !== undefined &&
			allianceStatsEvents !== null &&
			allianceStatsEvents !== undefined
		) {
			return new this(
				unitStatsEvents,
				itemStatsEvents,
				allianceStatsEvents,
			);
		} else throw new DeserializationError();
	}
}
