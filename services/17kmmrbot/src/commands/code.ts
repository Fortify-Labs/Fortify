import { inject, injectable } from "inversify";
import { ChatUserstate, Client } from "tmi.js";
import { RedisConnector } from "@shared/connectors/redis";
import { ExtractorService } from "@shared/services/extractor";
import { UserCacheKey, MatchState } from "@shared/state";
import { ItemSlot } from "@shared/definitions/gsiTypes";
import { TwitchCommand } from "../definitions/twitchCommand";

import { EquippedItemV8, ShareCodeV8 } from "underlords";

@injectable()
export class CodeCommand implements TwitchCommand {
	invocations = ["!code"];

	constructor(
		@inject(ExtractorService) public extractorService: ExtractorService,
		@inject(RedisConnector) public redis: RedisConnector,
	) {}

	async handler(
		client: Client,
		channel: string,
		tags: ChatUserstate,
		message: string,
	) {
		const user = await this.extractorService.getUser(channel);

		const matchID = await this.redis.getAsync(
			`user:${user.steamid}:${UserCacheKey.matchID}`,
		);

		if (!matchID) {
			return client.say(channel, `No match id found for ${user.name}`);
		}

		// Fetch fortify player state by steamid
		const rawMatch = await this.redis.getAsync(`match:${matchID}`);

		if (!rawMatch) {
			return client.say(channel, `No match found for ${user.name}`);
		}

		const matchState: MatchState = JSON.parse(rawMatch);

		let playerID = user.steamid;

		// Added option to fetch a board for a passed suer name
		const playerName = message.substr(5).trim().toLowerCase();

		if (playerName) {
			const player = Object.values(matchState.players).find(
				(p) =>
					p.public_player_state.persona_name?.toLowerCase() ===
					playerName,
			);

			if (player) {
				playerID = player.id;
			}
		}

		const player = matchState.players[playerID];

		if (player) {
			const shareCode = new ShareCodeV8();
			const pps = player.public_player_state;

			// Combine all the information needed from both sides
			const units = pps.units ?? [];
			const itemSlots = pps.item_slots ?? [];

			// Map assigned unit entity index to item
			const { entindexToItem, unequippedItems } = itemMapper(itemSlots);

			// Unit related
			for (const {
				entindex,
				unit_id,
				position: { x, y },
				rank,
			} of units) {
				if (y >= 0) {
					// Store each board unit
					shareCode.boardUnitIDs[x][y] = unit_id;
					// Store units ranks
					shareCode.unitRanks[x][y] = rank;

					// Store each equipped unit item
					const item = entindexToItem[entindex];
					if (item) {
						shareCode.unitItems[x][y] = new EquippedItemV8(
							item.item_id,
						);
					}

					// Store Underlords & Underlords ranks
					if (unit_id > 1000) {
						// Override the board unit id with 255 (as 255 is the highest value an unsigned uint8 can hold)
						shareCode.boardUnitIDs[x][y] = 255;
						shareCode.underlordRanks = [rank, 0];
					}
				}
			}

			// Store selected Underlord & Underlord talents
			shareCode.underlordIDs = [pps.underlord, 0];

			if (pps.underlord_selected_talents) {
				const selectedTalents = pps.underlord_selected_talents.map(
					(talent) => talent - 100000,
				);

				selectedTalents.forEach((talent, index) => {
					shareCode.selectedTalents[index] = [talent, 0];
				});
			}

			for (const {
				entindex,
				unit_id,
				position: { x, y },
				rank,
			} of units) {
				// if y is -1 then it's benched
				if (y < 0 && unit_id < 1000) {
					// Store each board unit
					shareCode.benchedUnitIDs[x] = unit_id;
					// Store units ranks
					shareCode.benchUnitRanks[x] = rank;

					// Store each equipped unit item
					const item = entindexToItem[entindex];
					if (item) {
						shareCode.benchUnitItems[x] = new EquippedItemV8(
							item.item_id,
						);
					}
				}
			}

			// Store unequipped items
			unequippedItems.forEach((item, index) => {
				shareCode.unequippedItems[0][index] = new EquippedItemV8(
					item.item_id,
				);
			});

			// Store opponent board
			const opponentSlot = pps.opponent_player_slot;
			const opponent = Object.values(matchState.players).find(
				(p) => p.public_player_state.player_slot === opponentSlot,
			);

			if (opponent) {
				const opps = opponent.public_player_state;

				const { entindexToItem: opponentEntindexToItem } = itemMapper(
					opps.item_slots ?? [],
				);

				// Unit related
				for (const {
					entindex,
					unit_id,
					position: { x, y },
					rank,
				} of opps.units ?? []) {
					if (y >= 0) {
						// Store each board unit
						shareCode.boardUnitIDs[7 - x][7 - y] = unit_id;
						// Store units ranks
						shareCode.unitRanks[7 - x][7 - y] = rank;

						// Store each equipped unit item
						const item = opponentEntindexToItem[entindex];
						if (item) {
							shareCode.unitItems[7 - x][
								7 - y
							] = new EquippedItemV8(item.item_id);
						}

						// Store Underlords & Underlords ranks
						if (unit_id > 1000) {
							// Override the board unit id with 255 (as 255 is the highest value an unsigned uint8 can hold)
							shareCode.boardUnitIDs[7 - x][7 - y] = 255;
							shareCode.underlordRanks[1] = rank;
						}
					}
				}

				shareCode.underlordIDs[1] = opps.underlord;

				if (opps.underlord_selected_talents) {
					const selectedTalents = opps.underlord_selected_talents.map(
						(talent) => talent - 100000,
					);

					selectedTalents.forEach((talent, index) => {
						shareCode.selectedTalents[index] = [
							shareCode.selectedTalents[index][0],
							talent,
						];
					});
				}
			}

			return client.say(channel, `Share code: ${shareCode.toString()}`);
		} else {
			return client.say(
				channel,
				`Could not find a board for ${user.name}`,
			);
		}
	}
}

function itemMapper(itemSlots: ItemSlot[]) {
	return itemSlots.reduce<{
		entindexToItem: Record<number, ItemSlot | undefined>;
		unequippedItems: ItemSlot[];
	}>(
		(acc, itemSlot) => {
			// Separate equipped items from unequipped items
			if (itemSlot.assigned_unit_entindex) {
				acc.entindexToItem[itemSlot.assigned_unit_entindex] = itemSlot;
			} else {
				acc.unequippedItems.push(itemSlot);
			}

			return acc;
		},
		{
			entindexToItem: {},
			unequippedItems: [],
		},
	);
}
