import { FortifyEventClass, FortifyEventTopics, FortifyEvent } from "./events";

export enum GameEventType {
	UNKNOWN,
}

export class GameEvent extends FortifyEventClass<GameEventType> {
	public _topic = FortifyEventTopics.GAME;
	public type = GameEventType.UNKNOWN;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public static deserialize<GameEventType>(obj: FortifyEvent<GameEventType>) {
		return new this();
	}
}
