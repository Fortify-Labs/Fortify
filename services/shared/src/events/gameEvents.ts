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

		if (matchID && players && gameMode)
			return new this(matchID, players, gameMode);
		else throw new DeserializationError();
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

		if (matchID && steamID && finalPlace)
			return new this(matchID, steamID, finalPlace);
		else throw new DeserializationError();
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

		if (matchID) return new this(matchID);
		else throw new DeserializationError();
	}
}

export class RankTierUpdateEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.RANK_TIER_UPDATE;

	constructor(public accountID: string, public rankTier: number) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		const accountID = obj["accountID"] as string | null;
		const rankTier = obj["rankTier"] as number | null;

		if (accountID && rankTier) return new this(accountID, rankTier);
		else throw new DeserializationError();
	}
}
