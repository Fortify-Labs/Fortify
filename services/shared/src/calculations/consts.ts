export interface ShopOdds {
	Normal: {
		0: ShopLevelOdds;
		1: ShopLevelOdds;
		2: ShopLevelOdds;
		3: ShopLevelOdds;
		4: ShopLevelOdds;
		5: ShopLevelOdds;
		6: ShopLevelOdds;
		7: ShopLevelOdds;
		8: ShopLevelOdds;
		9: ShopLevelOdds;
		10: ShopLevelOdds;

		[key: string]: ShopLevelOdds;
	};
	Duos: {
		0: ShopLevelOdds;
		1: ShopLevelOdds;
		2: ShopLevelOdds;
		3: ShopLevelOdds;
		4: ShopLevelOdds;
		5: ShopLevelOdds;
		6: ShopLevelOdds;
		7: ShopLevelOdds;
		8: ShopLevelOdds;
		9: ShopLevelOdds;
		10: ShopLevelOdds;

		[key: string]: ShopLevelOdds;
	};
	Turbo: {
		0: ShopLevelOdds;
		5: ShopLevelOdds;
		6: ShopLevelOdds;
		7: ShopLevelOdds;
		8: ShopLevelOdds;
		9: ShopLevelOdds;
		10: ShopLevelOdds;

		[key: string]: ShopLevelOdds;
	};
}

export interface ShopLevelOdds {
	1: number;
	2: number;
	3: number;
	4: number;
	5: number;

	[key: string]: number;
}

export const unitTiers = [1, 2, 3, 4, 5];

export const odds: ShopOdds = {
	Normal: {
		0: {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		},
		1: {
			1: 0.8,
			2: 0.2,
			3: 0,
			4: 0,
			5: 0,
		},
		2: {
			1: 0.7,
			2: 0.3,
			3: 0,
			4: 0,
			5: 0,
		},
		3: {
			1: 0.55,
			2: 0.35,
			3: 0.1,
			4: 0,
			5: 0,
		},
		4: {
			1: 0.45,
			2: 0.4,
			3: 0.15,
			4: 0,
			5: 0,
		},
		5: {
			1: 0.35,
			2: 0.4,
			3: 0.25,
			4: 0,
			5: 0,
		},
		6: {
			1: 0.25,
			2: 0.35,
			3: 0.35,
			4: 0.05,
			5: 0,
		},
		7: {
			1: 0.2,
			2: 0.3,
			3: 0.4,
			4: 0.1,
			5: 0,
		},
		8: {
			1: 0.18,
			2: 0.24,
			3: 0.35,
			4: 0.2,
			5: 0.03,
		},
		9: {
			1: 0.15,
			2: 0.21,
			3: 0.3,
			4: 0.28,
			5: 0.06,
		},
		10: {
			1: 0.12,
			2: 0.18,
			3: 0.28,
			4: 0.32,
			5: 0.1,
		},
	},
	Duos: {
		0: {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		},
		1: {
			1: 0.8,
			2: 0.2,
			3: 0,
			4: 0,
			5: 0,
		},
		2: {
			1: 0.7,
			2: 0.3,
			3: 0,
			4: 0,
			5: 0,
		},
		3: {
			1: 0.55,
			2: 0.35,
			3: 0.1,
			4: 0,
			5: 0,
		},
		4: {
			1: 0.45,
			2: 0.4,
			3: 0.15,
			4: 0,
			5: 0,
		},
		5: {
			1: 0.35,
			2: 0.4,
			3: 0.25,
			4: 0,
			5: 0,
		},
		6: {
			1: 0.25,
			2: 0.35,
			3: 0.35,
			4: 0.05,
			5: 0,
		},
		7: {
			1: 0.2,
			2: 0.3,
			3: 0.4,
			4: 0.1,
			5: 0,
		},
		8: {
			1: 0.18,
			2: 0.24,
			3: 0.35,
			4: 0.2,
			5: 0.03,
		},
		9: {
			1: 0.15,
			2: 0.21,
			3: 0.3,
			4: 0.28,
			5: 0.06,
		},
		10: {
			1: 0.12,
			2: 0.18,
			3: 0.28,
			4: 0.32,
			5: 0.1,
		},
	},
	Turbo: {
		0: {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		},
		5: {
			1: 0.4,
			2: 0.35,
			3: 0.25,
			4: 0,
			5: 0,
		},
		6: {
			1: 0.35,
			2: 0.3,
			3: 0.3,
			4: 0.05,
			5: 0,
		},
		7: {
			1: 0.25,
			2: 0.3,
			3: 0.35,
			4: 0.1,
			5: 0,
		},
		8: {
			1: 0.22,
			2: 0.27,
			3: 0.35,
			4: 0.15,
			5: 0.01,
		},
		9: {
			1: 0.22,
			2: 0.25,
			3: 0.3,
			4: 0.2,
			5: 0.03,
		},
		10: {
			1: 0.15,
			2: 0.21,
			3: 0.28,
			4: 0.3,
			5: 0.06,
		},
	},
};
