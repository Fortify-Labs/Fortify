// Event topics

export enum FortifyEventTopics {
	GENERIC = "generic-events",
	SYSTEM = "system-events",
	GAME = "game-events",
	/**
	 * Technically GSI is not an event topic,
	 * as it contains raw data.
	 *
	 * I'll leave it in here for now,
	 * in order to have all Kafka topics
	 * in one place.
	 */
	GSI = "gsi",
}

// Abstract implementation and interfaces for events

export class DeserializationError extends Error {}

export interface FortifyEvent<T> {
	type: T;
	[key: string]: unknown;
}

export abstract class FortifyEventClass<T> implements FortifyEvent<T> {
	[key: string]: unknown;

	public abstract _topic: FortifyEventTopics;
	public abstract type: T;

	public timestamp = new Date();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	new(...args: unknown[]) {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public static deserialize<T>(_obj: FortifyEvent<T>) {
		throw new DeserializationError();
	}

	public serialize(): string {
		return JSON.stringify(this, (key, value) =>
			!key.startsWith("_") ? value : undefined,
		);
	}
}
