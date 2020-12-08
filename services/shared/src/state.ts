import { PrivatePlayerState, PublicPlayerState } from "./definitions/gsiTypes";

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
	id?: string;

	// the key in this record is the user's account id itself
	players: Record<string, FortifyPlayer>;
	mode: FortifyGameMode;
	pool: Record<number, number>;

	averageMMR: number;
	created: number;
	ended?: number;
}

export class FortifyPlayerState {
	constructor(public readonly steamid: string) {}

	public lobby: FortifyPlayerStateLobby = {
		id: undefined,

		mode: FortifyGameMode.Invalid,
		players: {},
		pool: {},

		averageMMR: 0,

		created: 0,
		ended: undefined,
	};
}

export interface FortifyPlayer {
	name: string;
	accountID: string;
	slot: number;

	finalPlace: number;

	rankTier?: number;
	globalLeaderboardRank?: number;

	units?: Array<{
		unitID: number;
		rank: number;
		draftTier: number;
	}>;
}

export interface StorableState {
	toString(): string;
}

export enum UserCacheKey {
	matchID = "matchID",
	cache = "cache",
}

export interface PlayerSnapshot {
	id: string;

	public_player_state: PublicPlayerState;
	private_player_state?: PrivatePlayerState;
}

export interface MatchState {
	id: string;

	// timestamps
	created: number;
	updated: number;
	ended?: number;

	updateCount: number;

	mode: FortifyGameMode;
	averageMMR: number;

	players: Record<string, PlayerSnapshot>;
	pool: Record<number, number>;
}
