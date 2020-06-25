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

	public lobby: {
		players: Record<string, FortifyPlayer>;
	} = {
		players: {},
	};
}

export class FortifyPlayer {
	public steamid = "";
	public name = "";

	public final_place? = -1;
}

export enum FortifyFSMCommandType {
	UNDEFINED,
	RESET,
}

export class FortifyFSMCommand {
	public type = FortifyFSMCommandType.UNDEFINED;
	public payload: Record<string, unknown> = {};
	public steamid = "";
}
