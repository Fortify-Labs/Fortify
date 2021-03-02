import { GQLModule } from "../../definitions/module";
import { ApolloError, gql } from "apollo-server-express";
import {
	Resolvers,
	Match,
	GameMode,
	MatchPlayerSnapshot,
	MatchSlot,
	PoolEntry,
} from "../../definitions/graphql/types";
import { injectable, inject } from "inversify";
import { PostgresConnector } from "@shared/connectors/postgres";
import { getQueryParams } from "../../util/params";
import { MatchService } from "@shared/services/match";
import { FortifyGameMode, MatchState } from "@shared/state";
import { Match as DbMatch } from "@shared/db/entities/match";
import { GQLPubSub } from "../pubsub";
import { StateService } from "@shared/services/state";
import { Logger } from "@shared/logger";
import { Context, PermissionScope } from "@shared/definitions/context";

@injectable()
export class MatchModule implements GQLModule {
	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
		@inject(MatchService) private matchService: MatchService,
		@inject(GQLPubSub) private pubSub: GQLPubSub,
		@inject(StateService) private stateService: StateService,
		@inject(Logger) private logger: Logger,
	) {}

	typeDef = gql`
		extend type Query {
			currentMatches(
				"""
				Max limit is 50
				"""
				limit: Int
				offset: Int
			): [Match]

			match(id: ID!): Match

			"Returns the current match of a user"
			currentMatch: Match @auth(requires: USER)
		}

		extend type Subscription {
			match(id: ID!): Match
		}

		enum GameMode {
			INVALID
			NORMAL
			TURBO
			DUOS
			TECHPROTOTYPEA
			SANDBOX
			PUZZLE
			TUTORIAL
			STREETFIGHT
		}

		type Match {
			id: ID!

			created: Date!
			updated: Date!
			ended: Date

			mode: GameMode
			averageMMR: Int

			players: [MatchPlayerSnapshot!]
			pool: [PoolEntry!]

			slots: [MatchSlot!] @deprecated(reason: "Use players instead")
		}

		type PoolEntry {
			index: Int!
			count: Int!
		}

		type MatchPlayerSnapshot {
			id: ID!

			profilePicture: String
			mmr: Int

			public_player_state: PublicPlayerState
			private_player_state: PrivatePlayerState
		}

		type MatchSlot {
			"Format: matchid#slot"
			matchSlotID: ID!

			slot: Int!
			finalPlace: Int!

			created: Date!
			updated: Date!

			match: Match
			"If no user profile is returned, matchPlayer will be populated instead"
			user: UserProfile
		}

		type PublicPlayerState {
			player_slot: Int!
			account_id: Int!
			connection_status: Int!
			is_human_player: Boolean
			health: Int!
			gold: Int!
			level: Int!
			xp: Int!
			final_place: Int!
			next_level_xp: Int!
			sequence_number: Int!
			shop_cost_modifier: Int!
			reroll_cost_modifier: Int!
			win_streak: Int!
			lose_streak: Int!
			rank_tier: Int!
			disconnected_time: Int!
			platform: Int!
			event_tier: Int!
			persona_name: String
			wins: Int!
			losses: Int!
			player_loadout: [PlayerLoadout!]
			net_worth: Int!
			"""
			combat_result === 0 - if combat was drawn
			combat_result === 1 - if player won
			combat_result === 2 - if opponent won
			"""
			combat_result: Int
			lobby_team: Int!
			is_mirrored_match: Boolean
			underlord: Int!
			underlord_selected_talents: [Int!]
			party_index: Int!
			board_unit_limit: Int!
			combat_type: Int!
			board_buddy: BoardBuddy
			brawny_kills_float: Int!
			owns_event: Boolean
			city_prestige_level: Int!
			stat_best_victory_duration: Int!
			stat_best_victory_net_worth: Int!
			stat_best_victory_remaining_health_percent: Int!
			stat_best_victory_units: Int!
			stat_prev_victory_duration: Int!
			stat_prev_victory_net_worth: Int!
			stat_prev_victory_units: Int!
			global_leaderboard_rank: Int
			units: [Unit]
			synergies: [Synergy!]
			combat_duration: Int
			opponent_player_slot: Int
			vs_opponent_wins: Int
			vs_opponent_losses: Int
			vs_opponent_draws: Int
			item_slots: [ItemSlot!]
		}

		type PrivatePlayerState {
			player_slot: Int!
			unclaimed_reward_count: Int!
			shop_locked: Boolean!
			shop_units: [ShopUnit!]
			gold_earned_this_round: Int!
			shop_generation_id: Int!
			grants_rewards: Int!
			sequence_number: Int!
			reroll_cost: Int!
			can_select_underlord: Boolean!
			used_item_reward_reroll_this_round: Boolean!
			used_turbo_bucket_reroll: Boolean
			turbo_buckets: [TurboBucket!]
			oldest_unclaimed_reward: OldestUnclaimedReward
			challenges: [Challenge]
			underlord_picker_offering: [UnderlordPickerOffering]
		}

		type ShopUnit {
			unit_id: Int!
			will_combine_two_stars: Boolean
			gold_cost: Int
			wanted_legendary: Boolean
			will_combine_three_stars: Boolean
			keywords: [Int!]
		}

		type TurboBucket {
			unit_ids: [Int!]!
			keywords: [Int!]
		}

		type OldestUnclaimedReward {
			reward_id: Int!
			choices: [Choice!]
		}

		type Choice {
			item_id: Int!
			available: Boolean!
		}

		type Challenge {
			slot_id: Int!
			sequence_id: Int!
			progress: Int!
			initial_progress: Int!
			claimed: Int!
		}

		type UnderlordPickerOffering {
			underlord_id: Int!
			build_id: Int!
		}

		type PlayerLoadout {
			slot: Int!
			sub_slot: Int!
			def_index: Int!
		}

		type BoardBuddy {
			desired_pos_x: Int!
			desired_pos_y: Int!
		}

		type Unit {
			entindex: Int!
			unit_id: Int!
			position: Position!
			rank: Int!
			gold_value: Int!
			kill_count: Int!
			kill_streak: Int!
			keywords: [Int!]
			duel_bonus_damage: Int!
			unit_cap_cost: Int!
			can_move_to_bench: Boolean
			can_be_sold: Boolean
			recommended_for_placement: Boolean
			float_kill_count: Int!
		}

		type Position {
			x: Int!
			y: Int!
		}

		type Synergy {
			keyword: Int!
			unique_unit_count: Int!
			bench_additional_unique_unit_count: Int
		}

		type ItemSlot {
			slot_index: Int!
			item_id: Int!
			assigned_unit_entindex: Int
		}
	`;

	resolver(): Resolvers {
		const {
			postgres,
			matchService,
			pubSub: { pubSub },
			stateService,
		} = this;

		const resolvers: Resolvers = {
			Query: {
				async currentMatches(parent, args) {
					const { limit, offset } = getQueryParams(args);

					const matchRepo = await postgres.getMatchRepo();
					const currentMatches = await matchRepo.find({
						where: { ended: null },
						order: {
							created: "DESC",
						},
						relations: ["slots", "slots.user"],
						take: limit,
						skip: offset,
					});

					const now = new Date();
					const utc = new Date(
						now.getTime() + now.getTimezoneOffset() * 60000,
					).getTime();

					return currentMatches.reduce<Match[]>((acc, match) => {
						// If the match started <1h ago, return it as a current match
						if (utc - match.created.getTime() < 60 * 60 * 1000) {
							acc.push(convertDbMatchToGqlMatch(match));
						}

						return acc;
					}, []);
				},
				async match(parent, { id }, context) {
					let match: Match | undefined = undefined;

					// Fetch match state from redis
					const matchState = await matchService.getMatchFromRedis(id);

					if (matchState) {
						match = convertMatchStateToGqlMatch(matchState);
					} else {
						// If match state cannot be found in redis, fetch from postgres
						const matchRepo = postgres.getMatchRepo();
						const dbMatch = await matchRepo.findOne(id, {
							relations: ["slots", "slots.user"],
						});

						if (dbMatch) {
							match = convertDbMatchToGqlMatch(dbMatch);
						}
					}

					// If the match is still undefined throw an error
					if (!match) {
						throw new ApolloError(
							`Could not find match for id: ${id}`,
							"QUERY_MATCH_UNDEFINED",
						);
					}

					const userRepo = postgres.getUserRepo();

					const dbUsers = await userRepo.findByIds(
						match.players?.map((player) => player.id) ?? [],
					);

					// Add mmr information to players
					for (const player of match.players ?? []) {
						const dbUser = dbUsers.find(
							(user) => user.steamid === player.id,
						);

						if (match.mode === GameMode.Normal) {
							player.mmr = dbUser?.standardRating?.mmr ?? 0;
						} else if (match.mode === GameMode.Turbo) {
							player.mmr = dbUser?.turboRating?.mmr ?? 0;
						} else if (match.mode === GameMode.Duos) {
							player.mmr = dbUser?.duosRating?.mmr ?? 0;
						} else {
							player.mmr = 0;
						}
					}

					// Strip private player states unless own or admin permissions
					return stripPrivatePlayerStates(match, context);
				},
				async currentMatch(parent, args, context, info) {
					const {
						user: { id },
					} = context;
					const matchID = await stateService.getUserMatchID(id);

					if (
						matchID &&
						resolvers.Query?.match &&
						typeof resolvers.Query.match === "function"
					) {
						return resolvers.Query?.match(
							parent,
							{ id: matchID },
							context,
							info,
						);
					} else {
						return null;
					}
				},
			},
			Subscription: {
				match: {
					async subscribe(_, { id }) {
						return pubSub.asyncIterator(`match:${id}`);
					},
					resolve(
						matchState: MatchState | undefined | null,
						_args: unknown,
						context: Context,
					) {
						if (!matchState?.id) {
							return null;
						}

						// Strip private player states unless own or admin permissions
						return stripPrivatePlayerStates(
							convertMatchStateToGqlMatch(matchState),
							context,
						);
					},
				},
			},
			MatchSlot: {
				async match(parent) {
					if (parent.match) return parent.match;

					const [matchID] = parent.matchSlotID.split("#");

					const matchRepo = await postgres.getMatchRepo();
					const match = await matchRepo.findOneOrFail(matchID, {
						relations: ["slots", "slots.user"],
					});

					return {
						...match,
						slots: match.slots.map(
							({ slot, finalPlace, created, updated }) => ({
								matchSlotID: matchID + "#" + slot,
								slot,
								finalPlace,
								created,
								updated,
							}),
						),
					};
				},
				async user(parent) {
					if (parent.user) return parent.user;

					const [matchID, slot] = parent.matchSlotID.split("#");

					const matchSlotRepo = await postgres.getMatchSlotRepo();
					const matchSlot = await matchSlotRepo.findOneOrFail({
						where: {
							match: { id: matchID },
							slot,
						},
						relations: ["user"],
					});

					return matchSlot.user ?? null;
				},
			},
			MatchPlayerSnapshot: {
				async mmr({ id, mmr }) {
					if (mmr) {
						return mmr;
					}

					// Default to standard mmr
					const userRepo = postgres.getUserRepo();
					const user = await userRepo.findOne(id);
					return user?.standardRating?.mmr ?? 0;
				},
				async profilePicture({ id, profilePicture }) {
					if (profilePicture) {
						return profilePicture;
					}

					const userRepo = postgres.getUserRepo();
					const user = await userRepo.findOne(id);
					return user?.profilePicture ?? "";
				},
			},
		};

		return resolvers;
	}
}

const convertMatchStateToGqlMatch = (matchState: MatchState) => {
	const match: Match = {
		...matchState,
		mode: FortifyGameMode[matchState.mode ?? 0].toUpperCase() as GameMode,
		players: Object.values(matchState.players),
		pool: Object.entries(matchState.pool ?? {}).reduce<PoolEntry[]>(
			(acc, [key, value]) => {
				const index = parseInt(key);

				acc.push({
					index,
					count: Math.max(value, 0),
				});

				return acc;
			},
			[],
		),
	};

	return match;
};

const convertDbMatchToGqlMatch = (dbMatch: DbMatch) => {
	const match: Match = {
		...dbMatch,
		slots: dbMatch.slots.map<MatchSlot>((slot) => ({
			matchSlotID: `${dbMatch.id}#${slot.slot}`,
			created: slot.created,
			updated: slot.updated,
			finalPlace: slot.finalPlace,
			slot: slot.slot,
		})),
		// id: dbMatch.id,
		averageMMR: dbMatch.averageMMR,
		mode: FortifyGameMode[dbMatch.gameMode] as GameMode,
		pool: [],
		players: dbMatch.slots.map<MatchPlayerSnapshot>((slot, index) => {
			return {
				id: slot.user?.steamid ?? `index-${index}`,
				public_player_state: {
					// TODO: Once match data will be stored, fill this with actual information
					account_id: parseInt(slot.user?.steamid ?? "0"),
					board_unit_limit: 0,
					brawny_kills_float: 0,
					city_prestige_level: 0,
					combat_type: 0,
					connection_status: 0,
					disconnected_time: 0,
					event_tier: 0,
					final_place: slot.finalPlace,
					gold: 0,
					health: 0,
					level: 0,
					lobby_team: 0,
					lose_streak: 0,
					losses: 0,
					net_worth: 0,
					next_level_xp: 0,
					party_index: 0,
					platform: 0,
					player_slot: slot.slot,
					rank_tier: 0,
					reroll_cost_modifier: 0,
					sequence_number: 0,
					shop_cost_modifier: 0,
					stat_best_victory_duration: 0,
					stat_best_victory_net_worth: 0,
					stat_best_victory_remaining_health_percent: 0,
					stat_best_victory_units: 0,
					stat_prev_victory_duration: 0,
					stat_prev_victory_net_worth: 0,
					stat_prev_victory_units: 0,
					underlord: 0,
					win_streak: 0,
					wins: 0,
					xp: 0,
				},
				// TODO: Once match data will be stored, load private player state
			};
		}),
	};

	return match;
};

const stripPrivatePlayerStates = (match: Match, context: Context) => {
	if (context.scopes.includes(PermissionScope.Admin)) {
		return match;
	} else {
		match.players = match.players?.map((player) => {
			if (player.id !== context.user.id) {
				return {
					...player,
					private_player_state: null,
				};
			} else {
				return player;
			}
		});

		return match;
	}
};
