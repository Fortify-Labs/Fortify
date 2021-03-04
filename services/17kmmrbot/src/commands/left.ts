import { TwitchCommand } from "../definitions/twitchCommand";
import { Client, ChatUserstate } from "tmi.js";
import { injectable, inject } from "inversify";
import { ExtractorService } from "@shared/services/extractor";

import { unitMappings } from "@shared/units";
import { RedisConnector } from "@shared/connectors/redis";
import { MatchState, UserCacheKey } from "@shared/state";
import { unitsLeftInTier, unitsLeftInPool } from "@shared/calculations/pool";

@injectable()
export class LeftCommand implements TwitchCommand {
	invocations = ["!left"];
	showInHelp = true;
	description =
		"Lists the number of copies left in the pool for the requested unit (Usage: !left [unit name])";

	constructor(
		@inject(ExtractorService) private extractorService: ExtractorService,
		@inject(RedisConnector) private redis: RedisConnector,
	) {}

	async handler(
		client: Client,
		channel: string,
		tags: ChatUserstate,
		message: string,
	): Promise<unknown> {
		const user = await this.extractorService.getUser(channel);

		const matchID = await this.redis.getAsync(
			`user:${user.steamid}:${UserCacheKey.matchID}`,
		);

		if (!matchID) {
			return client.say(channel, "No match id found for " + user.name);
		}

		// Fetch fortify player state by steamid
		const rawMatch = await this.redis.getAsync(`match:${matchID}`);

		if (!rawMatch) {
			return client.say(channel, "No match found for " + user.name);
		}

		const matchState: MatchState = JSON.parse(rawMatch);

		if (
			Object.keys(matchState.players).length < 8 ||
			!matchState.pool ||
			!matchState.mode
		) {
			return client.say(
				channel,
				"Collecting game data, please try again in a little bit",
			);
		}

		const unitName = message.substr(6).trim().toLowerCase();

		const { mode, pool } = matchState;

		// Asking for amount of units in a tier
		if (
			unitName.startsWith("tier") ||
			(unitName.startsWith("t") && !isNaN(+unitName.charAt(1)))
		) {
			const tierName = unitName
				.replace("tier", "")
				.replace("t", "")
				.trim();

			try {
				const tier = parseInt(tierName);

				const { left, total } = unitsLeftInTier({
					mode,
					pool,
					tier,
				});

				return client.say(
					channel,
					`Tier ${tier}: ${left}/${total} units left`,
				);
			} catch (e) {
				return client.say(
					channel,
					`${tags.username} no tier "${tierName}" found`,
				);
			}
		}

		// Change aliases to their actual names in code

		let codeName = "";

		for (const [key, value] of Object.entries(unitMappings)) {
			if (value.alts.includes(unitName) || key === unitName) {
				codeName = key;
			}
		}

		if (!codeName) {
			await client.say(channel, `No unit called ${unitName} found`);
		}

		const { left, total } = unitsLeftInPool({
			mode,
			pool,
			unitCodeName: codeName,
		});

		return client.say(
			channel,
			`${unitMappings[codeName].displayName}: ${left}/${total} units left`,
		);
	}
}
