import {
	FortifyPlayerState,
	FortifyPlayer,
	FortifyGameMode,
} from "@shared/state";

export const getSteamID = async (channel: string) => {
	// TODO: Fetch Postgres for twitch channel id mapping to fortify account

	return "52601326";
};

export const getFSP = async (steamid: string): Promise<FortifyPlayerState> => {
	// TODO: Fetch current state from redis

	return {
		steamid,
		lobby: {
			players: { "52601326": { name: "Grey", steamid: "52601326" } },
		},
		mode: FortifyGameMode.Invalid,
	};
};

export const getPlayerName = (player: FortifyPlayer) => {
	// TODO: Return fortify player name --> Fetch postgres by player id
	// Only return player names that exist, otherwise throw an exception
	return player.name;
};

export const getPlayerRank = (player: FortifyPlayer) => {
	// TODO: Create CRON Job (potentially in python) that fetches the leaderboard rest api periodically
	// --> TODO: Save the results in a table in Postgres

	// TODO: Return the current rank of said player
	return 156;
};

export const getPlayerMMR = (player: FortifyPlayer) => {
	// TODO: Fetch postgres by player id --> return current MMR

	return 16008;
};

export const getGameMode = (fsp: FortifyPlayerState): string => {
	return FortifyGameMode[fsp.mode];
};

export const getAverageMMR = (fsp: FortifyPlayerState) => {
	// TODO: Fetch all player mmrs by ingame name --> calculate average mmr

	return "15k";
};
