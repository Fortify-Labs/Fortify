// Generic events

import { FortifyEventClass, FortifyEventTopics, FortifyEvent } from "./events";

export enum GenericEventType {
	UNKNOWN,
}

export class GenericEvent extends FortifyEventClass<GenericEventType> {
	public _topic = FortifyEventTopics.GENERIC;
	public type = GenericEventType.UNKNOWN;

	public static deserialize<GenericEventType>(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		obj: FortifyEvent<GenericEventType>,
	) {
		return new this();
	}
}
