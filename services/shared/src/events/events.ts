// Event topics

export enum FortifyEventTopics {
	GENERIC = "generic-events",
	SYSTEM = "system-events",
	GAME = "game-events",
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
