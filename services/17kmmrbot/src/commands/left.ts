import { TwitchCommand } from "../definitions/twitchCommand";
import { Client, ChatUserstate } from "tmi.js";
import { injectable, inject } from "inversify";
import { ExtractorService } from "@shared/services/extractor";

import {
	units,
	currentSeason,
	Unit as SeasonUnit,
	unitMappings,
	Unit,
} from "@shared/units";
import { poolSize } from "@shared/pool";
import { RedisConnector } from "@shared/connectors/redis";
import { FortifyGameMode, MatchState, UserCacheKey } from "@shared/state";

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

		if (Object.keys(matchState.players).length < 8 || !matchState.pool) {
			return client.say(
				channel,
				"Collecting game data, please try again in a little bit",
			);
		}

		const unitName = message.substr(6).trim().toLowerCase();

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

				// Copy & pasted from frontend "lobby/pool"-component
				const pool = matchState.pool;
				const currentUnits = units[currentSeason];
				const mappedUnits = Object.entries(currentUnits).reduce<
					Record<string, Unit & { name: string }>
				>((acc, [name, unit]) => {
					if (
						unit.content_enable_group !== "rotation" &&
						unit.draftTier > 0
					) {
						acc[unit.id] = {
							id: unit.id,
							dota_unit_name: unit.dota_unit_name,
							draftTier: unit.draftTier,
							name,
						};
					}

					return acc;
				}, {});

				const draftTiers = Object.values(mappedUnits).reduce<
					Record<string, Array<Unit & { name: string }>>
				>((acc, value) => {
					if (!acc[value.draftTier]) acc[value.draftTier] = [];
					acc[value.draftTier].push(value);

					return acc;
				}, {});

				const left = Object.values(draftTiers[tier])
					.map((unit) => unit.id)
					.reduce((acc, id) => {
						if (pool[id] && Number.isInteger(pool[id]))
							acc += pool[id] ?? 0;

						return acc;
					}, 0);
				const total =
					draftTiers[tier].length *
					poolSize[tier] *
					(matchState.mode === FortifyGameMode.Duos ? 2 : 1);

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

		const unit = units[currentSeason][codeName] as SeasonUnit | null;

		if (!unit || unit.id >= 1000) {
			return client.say(
				channel,
				`${tags.username} no unit called "${unitName}" found`,
			);
		}

		const { id, draftTier } = unit;
		const left = matchState.pool[id];
		const total =
			(poolSize[draftTier] ?? 0) *
			(matchState.mode === FortifyGameMode.Duos ? 2 : 1);

		return client.say(
			channel,
			`${unitMappings[codeName].displayName}: ${left}/${total} units left`,
		);
	}
}
