/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-prototype-builtins */
// To parse this data:
//
//   import { Convert } from "./file";
//
//   const logs = Convert.toLogs(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Logs {
	block: Block[];
	auth: string;
}

export interface Block {
	data: Datum[];
}

export interface Datum {
	public_player_state?: PublicPlayerState;
	private_player_state?: PrivatePlayerState;
}

export interface PrivatePlayerState {
	player_slot: number;
	unclaimed_reward_count: number;
	shop_locked: boolean;
	shop_units: ShopUnit[];
	gold_earned_this_round: number;
	shop_generation_id: number;
	grants_rewards: number;
	sequence_number: number;
	reroll_cost: number;
	can_select_underlord: boolean;
	used_item_reward_reroll_this_round: boolean;
	used_turbo_bucket_reroll?: boolean;
	turbo_buckets?: TurboBucket[];
	oldest_unclaimed_reward?: OldestUnclaimedReward;
	challenges?: Challenge[];
	underlord_picker_offering?: UnderlordPickerOffering[];
}

export interface Challenge {
	slot_id: number;
	sequence_id: number;
	progress: number;
	initial_progress: number;
	claimed: number;
}

export interface OldestUnclaimedReward {
	reward_id: number;
	choices: Choice[];
}

export interface Choice {
	item_id: number;
	available: boolean;
}

export interface ShopUnit {
	unit_id: number;
	will_combine_two_stars?: boolean;
	gold_cost?: number;
	wanted_legendary?: boolean;
	will_combine_three_stars?: boolean;
	keywords?: number[];
}

export interface TurboBucket {
	unit_ids: number[];
	keywords?: number[];
}

export interface UnderlordPickerOffering {
	underlord_id: number;
	build_id: number;
}

export interface PublicPlayerState {
	player_slot: number;
	account_id: number;
	connection_status: number;
	is_human_player: boolean;
	health: number;
	gold: number;
	level: number;
	xp: number;
	units?: Unit[];
	final_place: number;
	next_level_xp: number;
	synergies?: Synergy[];
	sequence_number: number;
	shop_cost_modifier: number;
	reroll_cost_modifier: number;
	win_streak: number;
	lose_streak: number;
	rank_tier: number;
	disconnected_time: number;
	platform: number;
	event_tier: number;
	wins: number;
	losses: number;
	player_loadout: PlayerLoadout[];
	net_worth: number;
	combat_result: number;
	lobby_team: number;
	is_mirrored_match: boolean;
	underlord: number;
	board_unit_limit: number;
	combat_type: number;
	board_buddy: BoardBuddy;
	brawny_kills_float: number;
	owns_event: boolean;
	city_prestige_level: number;
	stat_best_victory_duration: number;
	stat_best_victory_net_worth: number;
	stat_best_victory_remaining_health_percent: number;
	stat_best_victory_units: number;
	stat_prev_victory_duration: number;
	stat_prev_victory_net_worth: number;
	stat_prev_victory_units: number;
	persona_name?: string;
	party_index?: number;
	combat_duration?: number;
	item_slots?: ItemSlot[];
	opponent_player_slot?: number;
	vs_opponent_wins?: number;
	vs_opponent_losses?: number;
	vs_opponent_draws?: number;
	underlord_selected_talents?: number[];
	prop_state?: PropState[];
}

export interface BoardBuddy {
	desired_pos_x: number;
	desired_pos_y: number;
}

export interface ItemSlot {
	slot_index: number;
	item_id: number;
	assigned_unit_entindex?: number;
}

export interface PlayerLoadout {
	slot: number;
	sub_slot: number;
	def_index: number;
}

export interface PropState {
	prop_idx: number;
	num_clicks: number;
}

export interface Synergy {
	keyword: number;
	unique_unit_count: number;
	bench_additional_unique_unit_count?: number;
}

export interface Unit {
	entindex: number;
	unit_id: number;
	position: Position;
	rank: number;
	gold_value: number;
	kill_count: number;
	kill_streak: number;
	keywords?: number[];
	duel_bonus_damage: number;
	unit_cap_cost: number;
	can_move_to_bench: boolean;
	can_be_sold: boolean;
	recommended_for_placement: boolean;
	float_kill_count: number;
}

export interface Position {
	x: number;
	y: number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
	public static toLogs(json: string): Logs {
		return cast(JSON.parse(json), r("Logs"));
	}

	public static logsToJson(value: Logs): string {
		return JSON.stringify(uncast(value, r("Logs")), null, 2);
	}
}

function invalidValue(typ: any, val: any): never {
	throw Error(
		`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`,
	);
}

function jsonToJSProps(typ: any): any {
	if (typ.jsonToJS === undefined) {
		const map: any = {};
		typ.props.forEach(
			(p: any) => (map[p.json] = { key: p.js, typ: p.typ }),
		);
		typ.jsonToJS = map;
	}
	return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
	if (typ.jsToJSON === undefined) {
		const map: any = {};
		typ.props.forEach(
			(p: any) => (map[p.js] = { key: p.json, typ: p.typ }),
		);
		typ.jsToJSON = map;
	}
	return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any): any {
	function transformPrimitive(typ: string, val: any): any {
		if (typeof typ === typeof val) return val;
		return invalidValue(typ, val);
	}

	function transformUnion(typs: any[], val: any): any {
		// val must validate against one typ in typs
		const l = typs.length;
		for (let i = 0; i < l; i++) {
			const typ = typs[i];
			try {
				return transform(val, typ, getProps);
			} catch (_) {}
		}
		return invalidValue(typs, val);
	}

	function transformEnum(cases: string[], val: any): any {
		if (cases.indexOf(val) !== -1) return val;
		return invalidValue(cases, val);
	}

	function transformArray(typ: any, val: any): any {
		// val must be an array with no invalid elements
		if (!Array.isArray(val)) return invalidValue("array", val);
		return val.map((el) => transform(el, typ, getProps));
	}

	function transformDate(val: any): any {
		if (val === null) {
			return null;
		}
		const d = new Date(val);
		if (isNaN(d.valueOf())) {
			return invalidValue("Date", val);
		}
		return d;
	}

	function transformObject(
		props: { [k: string]: any },
		additional: any,
		val: any,
	): any {
		if (val === null || typeof val !== "object" || Array.isArray(val)) {
			return invalidValue("object", val);
		}
		const result: any = {};
		Object.getOwnPropertyNames(props).forEach((key) => {
			const prop = props[key];
			const v = Object.prototype.hasOwnProperty.call(val, key)
				? val[key]
				: undefined;
			result[prop.key] = transform(v, prop.typ, getProps);
		});
		Object.getOwnPropertyNames(val).forEach((key) => {
			if (!Object.prototype.hasOwnProperty.call(props, key)) {
				result[key] = transform(val[key], additional, getProps);
			}
		});
		return result;
	}

	if (typ === "any") return val;
	if (typ === null) {
		if (val === null) return val;
		return invalidValue(typ, val);
	}
	if (typ === false) return invalidValue(typ, val);
	while (typeof typ === "object" && typ.ref !== undefined) {
		typ = typeMap[typ.ref];
	}
	if (Array.isArray(typ)) return transformEnum(typ, val);
	if (typeof typ === "object") {
		return typ.hasOwnProperty("unionMembers")
			? transformUnion(typ.unionMembers, val)
			: typ.hasOwnProperty("arrayItems")
			? transformArray(typ.arrayItems, val)
			: typ.hasOwnProperty("props")
			? transformObject(getProps(typ), typ.additional, val)
			: invalidValue(typ, val);
	}
	// Numbers can be parsed by Date but shouldn't be.
	if (typ === Date && typeof val !== "number") return transformDate(val);
	return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
	return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
	return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
	return { arrayItems: typ };
}

function u(...typs: any[]) {
	return { unionMembers: typs };
}

function o(props: any[], additional: any) {
	return { props, additional };
}

function m(additional: any) {
	return { props: [], additional };
}

function r(name: string) {
	return { ref: name };
}

const typeMap: any = {
	Logs: o(
		[
			{ json: "block", js: "block", typ: a(r("Block")) },
			{ json: "auth", js: "auth", typ: "" },
		],
		false,
	),
	Block: o([{ json: "data", js: "data", typ: a(r("Datum")) }], false),
	Datum: o(
		[
			{
				json: "public_player_state",
				js: "public_player_state",
				typ: u(undefined, r("PublicPlayerState")),
			},
			{
				json: "private_player_state",
				js: "private_player_state",
				typ: u(undefined, r("PrivatePlayerState")),
			},
		],
		false,
	),
	PrivatePlayerState: o(
		[
			{ json: "player_slot", js: "player_slot", typ: 0 },
			{
				json: "unclaimed_reward_count",
				js: "unclaimed_reward_count",
				typ: 0,
			},
			{ json: "shop_locked", js: "shop_locked", typ: true },
			{ json: "shop_units", js: "shop_units", typ: a(r("ShopUnit")) },
			{
				json: "gold_earned_this_round",
				js: "gold_earned_this_round",
				typ: 0,
			},
			{ json: "shop_generation_id", js: "shop_generation_id", typ: 0 },
			{ json: "grants_rewards", js: "grants_rewards", typ: 0 },
			{ json: "sequence_number", js: "sequence_number", typ: 0 },
			{ json: "reroll_cost", js: "reroll_cost", typ: 0 },
			{
				json: "can_select_underlord",
				js: "can_select_underlord",
				typ: true,
			},
			{
				json: "used_item_reward_reroll_this_round",
				js: "used_item_reward_reroll_this_round",
				typ: true,
			},
			{
				json: "used_turbo_bucket_reroll",
				js: "used_turbo_bucket_reroll",
				typ: u(undefined, true),
			},
			{
				json: "turbo_buckets",
				js: "turbo_buckets",
				typ: u(undefined, a(r("TurboBucket"))),
			},
			{
				json: "oldest_unclaimed_reward",
				js: "oldest_unclaimed_reward",
				typ: u(undefined, r("OldestUnclaimedReward")),
			},
			{
				json: "challenges",
				js: "challenges",
				typ: u(undefined, a(r("Challenge"))),
			},
			{
				json: "underlord_picker_offering",
				js: "underlord_picker_offering",
				typ: u(undefined, a(r("UnderlordPickerOffering"))),
			},
		],
		false,
	),
	Challenge: o(
		[
			{ json: "slot_id", js: "slot_id", typ: 0 },
			{ json: "sequence_id", js: "sequence_id", typ: 0 },
			{ json: "progress", js: "progress", typ: 0 },
			{ json: "initial_progress", js: "initial_progress", typ: 0 },
			{ json: "claimed", js: "claimed", typ: 0 },
		],
		false,
	),
	OldestUnclaimedReward: o(
		[
			{ json: "reward_id", js: "reward_id", typ: 0 },
			{ json: "choices", js: "choices", typ: a(r("Choice")) },
		],
		false,
	),
	Choice: o(
		[
			{ json: "item_id", js: "item_id", typ: 0 },
			{ json: "available", js: "available", typ: true },
		],
		false,
	),
	ShopUnit: o(
		[
			{ json: "unit_id", js: "unit_id", typ: 0 },
			{
				json: "will_combine_two_stars",
				js: "will_combine_two_stars",
				typ: u(undefined, true),
			},
			{ json: "gold_cost", js: "gold_cost", typ: u(undefined, 0) },
			{
				json: "wanted_legendary",
				js: "wanted_legendary",
				typ: u(undefined, true),
			},
			{
				json: "will_combine_three_stars",
				js: "will_combine_three_stars",
				typ: u(undefined, true),
			},
			{ json: "keywords", js: "keywords", typ: u(undefined, a(0)) },
		],
		false,
	),
	TurboBucket: o(
		[
			{ json: "unit_ids", js: "unit_ids", typ: a(0) },
			{ json: "keywords", js: "keywords", typ: u(undefined, a(0)) },
		],
		false,
	),
	UnderlordPickerOffering: o(
		[
			{ json: "underlord_id", js: "underlord_id", typ: 0 },
			{ json: "build_id", js: "build_id", typ: 0 },
		],
		false,
	),
	PublicPlayerState: o(
		[
			{ json: "player_slot", js: "player_slot", typ: 0 },
			{ json: "account_id", js: "account_id", typ: 0 },
			{ json: "connection_status", js: "connection_status", typ: 0 },
			{ json: "is_human_player", js: "is_human_player", typ: true },
			{ json: "health", js: "health", typ: 0 },
			{ json: "gold", js: "gold", typ: 0 },
			{ json: "level", js: "level", typ: 0 },
			{ json: "xp", js: "xp", typ: 0 },
			{ json: "units", js: "units", typ: u(undefined, a(r("Unit"))) },
			{ json: "final_place", js: "final_place", typ: 0 },
			{ json: "next_level_xp", js: "next_level_xp", typ: 0 },
			{
				json: "synergies",
				js: "synergies",
				typ: u(undefined, a(r("Synergy"))),
			},
			{ json: "sequence_number", js: "sequence_number", typ: 0 },
			{ json: "shop_cost_modifier", js: "shop_cost_modifier", typ: 0 },
			{
				json: "reroll_cost_modifier",
				js: "reroll_cost_modifier",
				typ: 0,
			},
			{ json: "win_streak", js: "win_streak", typ: 0 },
			{ json: "lose_streak", js: "lose_streak", typ: 0 },
			{ json: "rank_tier", js: "rank_tier", typ: 0 },
			{ json: "disconnected_time", js: "disconnected_time", typ: 3.14 },
			{ json: "platform", js: "platform", typ: 0 },
			{ json: "event_tier", js: "event_tier", typ: 0 },
			{ json: "wins", js: "wins", typ: 0 },
			{ json: "losses", js: "losses", typ: 0 },
			{
				json: "player_loadout",
				js: "player_loadout",
				typ: a(r("PlayerLoadout")),
			},
			{ json: "net_worth", js: "net_worth", typ: 0 },
			{ json: "combat_result", js: "combat_result", typ: 0 },
			{ json: "lobby_team", js: "lobby_team", typ: 0 },
			{ json: "is_mirrored_match", js: "is_mirrored_match", typ: true },
			{ json: "underlord", js: "underlord", typ: 0 },
			{ json: "board_unit_limit", js: "board_unit_limit", typ: 0 },
			{ json: "combat_type", js: "combat_type", typ: 0 },
			{ json: "board_buddy", js: "board_buddy", typ: r("BoardBuddy") },
			{ json: "brawny_kills_float", js: "brawny_kills_float", typ: 3.14 },
			{ json: "owns_event", js: "owns_event", typ: true },
			{ json: "city_prestige_level", js: "city_prestige_level", typ: 0 },
			{
				json: "stat_best_victory_duration",
				js: "stat_best_victory_duration",
				typ: 0,
			},
			{
				json: "stat_best_victory_net_worth",
				js: "stat_best_victory_net_worth",
				typ: 0,
			},
			{
				json: "stat_best_victory_remaining_health_percent",
				js: "stat_best_victory_remaining_health_percent",
				typ: 0,
			},
			{
				json: "stat_best_victory_units",
				js: "stat_best_victory_units",
				typ: 0,
			},
			{
				json: "stat_prev_victory_duration",
				js: "stat_prev_victory_duration",
				typ: 0,
			},
			{
				json: "stat_prev_victory_net_worth",
				js: "stat_prev_victory_net_worth",
				typ: 0,
			},
			{
				json: "stat_prev_victory_units",
				js: "stat_prev_victory_units",
				typ: 0,
			},
			{ json: "persona_name", js: "persona_name", typ: u(undefined, "") },
			{ json: "party_index", js: "party_index", typ: u(undefined, 0) },
			{
				json: "combat_duration",
				js: "combat_duration",
				typ: u(undefined, 3.14),
			},
			{
				json: "item_slots",
				js: "item_slots",
				typ: u(undefined, a(r("ItemSlot"))),
			},
			{
				json: "opponent_player_slot",
				js: "opponent_player_slot",
				typ: u(undefined, 0),
			},
			{
				json: "vs_opponent_wins",
				js: "vs_opponent_wins",
				typ: u(undefined, 0),
			},
			{
				json: "vs_opponent_losses",
				js: "vs_opponent_losses",
				typ: u(undefined, 0),
			},
			{
				json: "vs_opponent_draws",
				js: "vs_opponent_draws",
				typ: u(undefined, 0),
			},
			{
				json: "underlord_selected_talents",
				js: "underlord_selected_talents",
				typ: u(undefined, a(0)),
			},
			{
				json: "prop_state",
				js: "prop_state",
				typ: u(undefined, a(r("PropState"))),
			},
		],
		false,
	),
	BoardBuddy: o(
		[
			{ json: "desired_pos_x", js: "desired_pos_x", typ: 0 },
			{ json: "desired_pos_y", js: "desired_pos_y", typ: 0 },
		],
		false,
	),
	ItemSlot: o(
		[
			{ json: "slot_index", js: "slot_index", typ: 0 },
			{ json: "item_id", js: "item_id", typ: 0 },
			{
				json: "assigned_unit_entindex",
				js: "assigned_unit_entindex",
				typ: u(undefined, 0),
			},
		],
		false,
	),
	PlayerLoadout: o(
		[
			{ json: "slot", js: "slot", typ: 0 },
			{ json: "sub_slot", js: "sub_slot", typ: 0 },
			{ json: "def_index", js: "def_index", typ: 0 },
		],
		false,
	),
	PropState: o(
		[
			{ json: "prop_idx", js: "prop_idx", typ: 0 },
			{ json: "num_clicks", js: "num_clicks", typ: 0 },
		],
		false,
	),
	Synergy: o(
		[
			{ json: "keyword", js: "keyword", typ: 0 },
			{ json: "unique_unit_count", js: "unique_unit_count", typ: 0 },
			{
				json: "bench_additional_unique_unit_count",
				js: "bench_additional_unique_unit_count",
				typ: u(undefined, 0),
			},
		],
		false,
	),
	Unit: o(
		[
			{ json: "entindex", js: "entindex", typ: 0 },
			{ json: "unit_id", js: "unit_id", typ: 0 },
			{ json: "position", js: "position", typ: r("Position") },
			{ json: "rank", js: "rank", typ: 0 },
			{ json: "gold_value", js: "gold_value", typ: 0 },
			{ json: "kill_count", js: "kill_count", typ: 0 },
			{ json: "kill_streak", js: "kill_streak", typ: 0 },
			{ json: "keywords", js: "keywords", typ: u(undefined, a(0)) },
			{ json: "duel_bonus_damage", js: "duel_bonus_damage", typ: 0 },
			{ json: "unit_cap_cost", js: "unit_cap_cost", typ: 0 },
			{ json: "can_move_to_bench", js: "can_move_to_bench", typ: true },
			{ json: "can_be_sold", js: "can_be_sold", typ: true },
			{
				json: "recommended_for_placement",
				js: "recommended_for_placement",
				typ: true,
			},
			{ json: "float_kill_count", js: "float_kill_count", typ: 3.14 },
		],
		false,
	),
	Position: o(
		[
			{ json: "x", js: "x", typ: 0 },
			{ json: "y", js: "y", typ: 0 },
		],
		false,
	),
};
