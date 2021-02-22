export interface ULLeaderboard {
	time_posted: number;
	next_scheduled_post_time: number;
	leaderboard: Leaderboard[];
	success: boolean;
}

export interface Leaderboard {
	name: string;
	rank: number;
	level_score: number;
}

export enum LeaderboardType {
	Standard = "standard",
	Turbo = "turbo",
	Duos = "duos",
}

export const leaderboardTypeToNumber = (leaderboard: LeaderboardType) => {
	if (leaderboard === LeaderboardType.Standard) {
		return LeaderboardTypeNumbersEnum.Standard;
	} else if (leaderboard === LeaderboardType.Turbo) {
		return LeaderboardTypeNumbersEnum.Turbo;
	} else if (leaderboard === LeaderboardType.Duos) {
		return LeaderboardTypeNumbersEnum.Duos;
	} else {
		return -1;
	}
};

export enum LeaderboardTypeNumbersEnum {
	Standard = 0,
	Turbo = 1,
	Duos = 2,
}

export interface MappedLeaderboardEntry {
	steamid: string;
	mmr: number;
	rank: number;
}
