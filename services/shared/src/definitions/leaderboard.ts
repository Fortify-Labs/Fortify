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
