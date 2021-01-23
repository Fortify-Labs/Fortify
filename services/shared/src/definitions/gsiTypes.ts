import { Context } from "./context";

export interface Log {
	block: Block[];
	auth: string | Pick<Context, "user">;
	timestamp: string;
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
	final_place: number;
	next_level_xp: number;
	sequence_number: number;
	shop_cost_modifier: number;
	reroll_cost_modifier: number;
	win_streak: number;
	lose_streak: number;
	rank_tier: number;
	disconnected_time: number;
	platform: number;
	event_tier: number;
	persona_name: string;
	wins: number;
	losses: number;
	player_loadout: PlayerLoadout[];
	net_worth: number;
	/**
	 * `combat_result === 0` - if player won
	 * `combat_result === 1` - if combat was drawn
	 * `combat_result === 2` - if opponent won
	 */
	combat_result?: number;
	lobby_team: number;
	is_mirrored_match: boolean;
	underlord: number;
	underlord_selected_talents?: number[];
	party_index: number;
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
	global_leaderboard_rank?: number;
	units?: Unit[];
	synergies?: Synergy[];
	combat_duration?: number;
	opponent_player_slot?: number;
	vs_opponent_wins?: number;
	vs_opponent_losses?: number;
	vs_opponent_draws?: number;
	item_slots?: ItemSlot[];
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
