import { BigNumber } from "bignumber.js";

export const convert32to64SteamId = (steamid: string) => {
	return new BigNumber(steamid).plus("76561197960265728");
};

export const convert64to32SteamId = (steamid: string) => {
	return new BigNumber(steamid).minus("76561197960265728");
};
