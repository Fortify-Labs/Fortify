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

		if (matchID && steamID && finalPlace && timestamp) {
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

		if (accountID && rankTier && mode)
			return new this(accountID, rankTier, mode);
		else throw new DeserializationError();
	}
}

export class SmurfDetectedEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.SMURF_DETECTED;

	constructor(
		public originalAccountID: string,
		public smurfAccountID: string,
	) {
		super();
	}

	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		const originalAccountID = obj["originalAccountID"] as string | null;
		const smurfAccountID = obj["smurfAccountID"] as string | null;

		if (originalAccountID && smurfAccountID)
			return new this(originalAccountID, smurfAccountID);
		else throw new DeserializationError();
	}
}
