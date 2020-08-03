import { injectable, inject } from "inversify";

import { FortifyGameMode, FortifyPlayerState } from "@shared/state";
import { RedisConnector } from "@shared/connectors/redis";

@injectable()
export class StateTransformationService {
	constructor(@inject(RedisConnector) private redis: RedisConnector) {}

	async loadState(steamid: string): Promise<FortifyPlayerState> {
		// Fetch player state from redis
		const rawState = await this.redis.getAsync("ps_" + steamid);

		// Check for null
		const state: FortifyPlayerState = rawState
			? JSON.parse(rawState)
			: new FortifyPlayerState(steamid);

		return state;
	}

	async saveState(state: FortifyPlayerState, steamid: string) {
		const stringifiedState = JSON.stringify(state);
		await this.redis.setAsync("ps_" + steamid, stringifiedState);
		await this.redis.publishAsync("ps_" + steamid, stringifiedState);

		return true;
	}

	resetState(state: FortifyPlayerState): FortifyPlayerState {
		state = this.resetLobby(state);

		return state;
	}

	resetLobby(state: FortifyPlayerState): FortifyPlayerState {
		state.lobby = {
			players: {},
			pool: {},
			mode: FortifyGameMode.Invalid,
		};

		return state;
	}
}
