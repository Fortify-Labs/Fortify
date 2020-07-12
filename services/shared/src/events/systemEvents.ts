import {
	FortifyEvent,
	FortifyEventClass,
	FortifyEventTopics,
	DeserializationError,
} from "./events";

export enum SystemEventType {
	UNKNOWN,
	FSM_RESET_REQUEST,
	TWITCH_LINKED,
	TWITCH_UNLINKED,
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
