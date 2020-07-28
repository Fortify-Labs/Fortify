import { TwitchCommand } from "../definitions/twitchCommand";
import { Client, ChatUserstate } from "tmi.js";
import { injectable, inject } from "inversify";
import { ExtractorService } from "../services/extractor";

import { S1Units, Unit as S1Unit, unitMappings } from "@shared/units";
import { poolSize } from "@shared/pool";

@injectable()
export class LeftCommand implements TwitchCommand {
	invocations = ["!left"];

	constructor(
		@inject(ExtractorService) private extractorService: ExtractorService,
	) {}

	async handler(
		client: Client,
		channel: string,
		tags: ChatUserstate,
		message: string,
	): Promise<unknown> {
		const user = await this.extractorService.getUser(channel);

		// Fetch fortify player state by steamid
		const fps = await this.extractorService.getPlayerState(user.steamid);

		if (!fps) {
			return client.say(
				channel,
				`No player state found for ${user.name}`,
			);
		}

		if (Object.keys(fps.lobby.players).length < 8 || !fps.lobby.pool) {
			return client.say(
				channel,
				"Collecting game data, please try again in a little bit",
			);
		}

		const unitName = message.substr(6).trim().toLowerCase();

		// Change aliases to their actual names in code

		let codeName = "";

		for (const [key, value] of Object.entries(unitMappings)) {
			if (value.includes(unitName) || key === unitName) {
				codeName = key;
			}
		}

		const unit = S1Units[codeName] as S1Unit | null;

		if (!unit || unit.id >= 1000) {
			return client.say(
				channel,
				`${user.name} no unit called "${unitName}" found`,
			);
		}

		const { id, draftTier } = unit;
		const left = fps.lobby.pool[id];
		const total = poolSize[draftTier] ?? 0;

		return client.say(channel, `${unitName}: ${left}/${total} units left`);
	}
}
