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

interface FortifyPlayerStateLobby {
	players: Record<string, FortifyPlayer>;
	mode: FortifyGameMode;
	pool: Record<number, number>;
}

export class FortifyPlayerState {
	constructor(public readonly steamid: string) {}

	public lobby: FortifyPlayerStateLobby = {
		mode: FortifyGameMode.Invalid,
		players: {},
		pool: {},
	};
}

export interface FortifyPlayer {
	name: string;
	accountID: string;
	slot: number;

	final_place?: number;

	rank_tier?: number;
	global_leaderboard_rank?: number;

	units?: Array<{
		unitID: number;
		rank: number;
		draftTier: number;
	}>;
}
