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

export interface UserCache {
	id: string;

	created?: number;
	updated?: number;
	ended?: number;

	players: Record<string, PlayerSnapshot>;
}

export enum UserCacheKey {
	matchID = "matchID",
	cache = "cache",
}

export interface PlayerSnapshot {
	/**
	 * Account ID
	 */
	id: string;

	/**
	 * Optional number indicating wether
	 * said account has been already detected as smurf
	 */
	smurfDetected?: number;

	/**
	 * Raw GSI public player state
	 */
	public_player_state: PublicPlayerState;
	/**
	 * Raw GSI private player state
	 */
	private_player_state?: PrivatePlayerState;
}

export interface MatchState {
	/**
	 * Match ID
	 */
	id: string;

	/**
	 * Creation timestamp
	 */
	created: number;
	/**
	 * Update timestamp
	 */
	updated: number;
	/**
	 * Ended timestamp
	 */
	ended?: number;

	/**
	 * Counting amount of updates happened to object
	 */
	updateCount: number;

	/**
	 * Game mode
	 */
	mode?: FortifyGameMode;
	/**
	 * Average lobby MMR
	 */
	averageMMR?: number;

	/**
	 * Lobby players
	 */
	players: Record<string, PlayerSnapshot>;
	/**
	 * Unit pool
	 */
	pool?: Record<number, number>;
}
