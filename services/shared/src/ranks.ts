export const rankToMMRMapping: Record<string, Record<string, number>> = {
	"0": { "0": 0, "1": 60, "2": 170, "3": 280, "4": 390 },
	"1": { "0": 500, "1": 630, "2": 755, "3": 880, "4": 1005 },
	"2": { "0": 1130, "1": 1275, "2": 1415, "3": 1555, "4": 1695 },
	"3": { "0": 1835, "1": 1995, "2": 2150, "3": 2305, "4": 2460 },
	"4": { "0": 2615, "1": 2810, "2": 3000, "3": 3190, "4": 3380 },
	"5": { "0": 3570, "1": 3800, "2": 4025, "3": 4250, "4": 4475 },
	"6": { "0": 4700, "1": 4965, "2": 5225, "3": 5485, "4": 5745 },
	"7": { "0": 6005, "1": 6325, "2": 6640, "3": 6955, "4": 7270 },
	"8": { "0": 7600 },
};

export const majorRankNameMapping: Record<string, string> = {
	"0": "Upstart",
	"1": "Grifter",
	"2": "Outlaw",
	"3": "Enforcer",
	"4": "Smuggler",
	"5": "Lieutenant",
	"6": "Boss",
	"7": "Big Boss",
	"8": "Lord of White Spire",
};

export const adjustedBigBossRanks: Record<string, number> = {
	"0": 13565,
	"1": 13884,
	"2": 14203,
	"3": 14522,
	"4": 14841,
};

export const mapRankTierToName = (rankTier: number) => {
	if (rankTier > 80) {
		return `No rank tier ${rankTier} found`;
	}

	const minorRank = rankTier % 10;
	const majorRank = (rankTier - minorRank) / 10;

	return `${majorRankNameMapping[majorRank]}${
		majorRank < 8 ? ` ${minorRank + 1}` : ""
	}`;
};
