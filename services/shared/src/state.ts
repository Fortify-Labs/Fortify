export enum FortifyGameMode {
	Invalid = 0,
	Normal = 1,
	Turbo = 2,
	Duos = 3,
	TechPrototypeA = 4,
	Sandbox = 5,
	Puzzle = 6,
	Tutorial = 7,
	Streetfight = 8,
}

export class FortifyPlayerState {
	constructor(public readonly steamid: string) {}

	public lobby: {
		players: Record<string, FortifyPlayer>;
	} = {
		players: {},
	};

	public mode: FortifyGameMode = FortifyGameMode.Invalid;
}

export interface FortifyPlayer {
	steamid: string;
	name: string;

	final_place?: number;
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
