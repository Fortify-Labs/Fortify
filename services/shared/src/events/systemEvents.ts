import {
	FortifyEvent,
	FortifyEventClass,
	FortifyEventTopics,
	DeserializationError,
} from "./events";
import { LeaderboardType, ULLeaderboard } from "../definitions/leaderboard";

export enum SystemEventType {
	UNKNOWN,
	FSM_RESET_REQUEST,
	TWITCH_LINKED,
	TWITCH_UNLINKED,
	TWITCH_MESSAGE_BROADCAST,
	IMPORT_COMPLETED,
	HISTORIZATION_COMPLETED,
}

export class TwitchLinkedEvent extends FortifyEventClass<SystemEventType> {
	public _topic = FortifyEventTopics.SYSTEM;
	public type = SystemEventType.TWITCH_LINKED;

	constructor(public steamid: string, public twitchName: string) {
		super();
	}

	public static deserialize<SystemEventType>(
		obj: FortifyEvent<SystemEventType>,
	) {
		const steamid = obj["steamid"] as string | null;
		const twitchName = obj["twitchName"] as string | null;

		if (steamid && twitchName) return new this(steamid, twitchName);
		else throw new DeserializationError();
	}
}

export class TwitchUnlinkedEvent extends FortifyEventClass<SystemEventType> {
	public _topic = FortifyEventTopics.SYSTEM;
	public type = SystemEventType.TWITCH_UNLINKED;

	constructor(public steamid: string, public twitchName: string) {
		super();
	}

	public static deserialize<SystemEventType>(
		obj: FortifyEvent<SystemEventType>,
	) {
		const steamid = obj["steamid"] as string | null;
		const twitchName = obj["twitchName"] as string | null;

		if (steamid && twitchName) return new this(steamid, twitchName);
		else throw new DeserializationError();
	}
}

export class FSMResetRequestEvent extends FortifyEventClass<SystemEventType> {
	public _topic = FortifyEventTopics.SYSTEM;
	public type = SystemEventType.FSM_RESET_REQUEST;

	constructor(public steamid: string) {
		super();
	}

	public static deserialize<SystemEventType>(
		obj: FortifyEvent<SystemEventType>,
	) {
		const steamid = obj["steamid"] as string | null;

		if (steamid) return new this(steamid);
		else throw new DeserializationError();
	}
}

export class TwitchMessageBroadcastEvent extends FortifyEventClass<SystemEventType> {
	public _topic = FortifyEventTopics.SYSTEM;
	public type = SystemEventType.TWITCH_MESSAGE_BROADCAST;

	constructor(public message: string) {
		super();
	}

	public static deserialize<SystemEventType>(
		obj: FortifyEvent<SystemEventType>,
	) {
		const message = obj["message"] as string | null;

		if (message) return new this(message);
		else throw new DeserializationError();
	}
}

export interface ImportCompletedEventArgs {
	leaderboard: ULLeaderboard;
}

export class ImportCompletedEvent extends FortifyEventClass<SystemEventType> {
	public _topic = FortifyEventTopics.SYSTEM;
	public type = SystemEventType.IMPORT_COMPLETED;

	constructor(
		public leaderboardType: LeaderboardType,
		public args?: ImportCompletedEventArgs,
	) {
		super();
	}

	public static deserialize<SystemEventType>(
		obj: FortifyEvent<SystemEventType>,
	) {
		const type = obj["leaderboardType"] as LeaderboardType | undefined;
		const args = obj["args"] as ImportCompletedEventArgs | undefined;
		const timestamp = obj["timestamp"] as string | null;

		if (
			type &&
			Object.values(LeaderboardType).includes(type) &&
			timestamp
		) {
			const event = new this(type, args);
			event.timestamp = new Date(timestamp);

			return event;
		} else throw new DeserializationError();
	}
}

export class HistorizationCompletedEvent extends FortifyEventClass<SystemEventType> {
	public _topic = FortifyEventTopics.SYSTEM;
	public type = SystemEventType.HISTORIZATION_COMPLETED;

	constructor(public leaderboardType: LeaderboardType) {
		super();
	}

	public static deserialize<SystemEventType>(
		obj: FortifyEvent<SystemEventType>,
	) {
		const type = obj["leaderboardType"] as LeaderboardType | null;
		const timestamp = obj["timestamp"] as string | null;

		if (
			type &&
			Object.values(LeaderboardType).includes(type) &&
			timestamp
		) {
			const event = new this(type);
			event.timestamp = new Date(timestamp);
			return event;
		} else throw new DeserializationError();
	}
}
