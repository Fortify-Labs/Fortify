// TODO: Turn this into a shared library

export enum Scope {
	GSI_INGRESS,
}

export interface Context {
	user: {
		id: string;
	};

	scopes: ReadonlyArray<Scope>;
}

export class FortifyPlayerState {
	constructor(public readonly steamid: string) {}

	public players: Record<string, FortifyPlayer> = {};
}

export class FortifyPlayer {
	public steamid = "";
	public name = "";

	public final_place? = -1;
}
