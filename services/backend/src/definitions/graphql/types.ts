/**
 * THIS IS A GENERATED FILE, DO NOT MODIFY DIRECTLY
 */

import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Context } from '@shared/definitions/context';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
// Generated on 2021-02-28T22:03:43+01:00

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /**
   * Custom scalar type for date.
   * A unix timestamp served as string.
   */
  Date: any;
};


export enum Scope {
  Admin = 'ADMIN',
  User = 'USER',
  GsiIngress = 'GSI_INGRESS',
  Unknown = 'UNKNOWN'
}

export type Query = {
  __typename?: 'Query';
  /** Returns wether the current bearer token is valid or not */
  authenticated: AuthenticatedObject;
  /** Returns the current context */
  context: Scalars['String'];
  /** Returns the current match of a user */
  currentMatch?: Maybe<Match>;
  currentMatches?: Maybe<Array<Maybe<Match>>>;
  leaderboard?: Maybe<Leaderboard>;
  /** @deprecated Use match query instead */
  lobby?: Maybe<Lobby>;
  match?: Maybe<Match>;
  profile?: Maybe<UserProfile>;
  status?: Maybe<SystemStatus>;
  /** Returns the current package.json version */
  version: Scalars['String'];
};


export type QueryCurrentMatchesArgs = {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
};


export type QueryLeaderboardArgs = {
  type?: Maybe<LeaderboardType>;
};


export type QueryLobbyArgs = {
  id?: Maybe<Scalars['ID']>;
};


export type QueryMatchArgs = {
  id: Scalars['ID'];
};


export type QueryProfileArgs = {
  steamid?: Maybe<Scalars['ID']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Used as placeholder as empty types aren't currently supported. Also fires and event to the _base_ subscription. */
  _base_: Scalars['String'];
  addUser: Scalars['String'];
  generateGsiJwt: Scalars['String'];
  removeUser: Scalars['Boolean'];
  updateProfile?: Maybe<UserProfile>;
};


export type MutationAddUserArgs = {
  user: UserInput;
};


export type MutationGenerateGsiJwtArgs = {
  id?: Maybe<Scalars['ID']>;
};


export type MutationRemoveUserArgs = {
  steamid: Scalars['String'];
};


export type MutationUpdateProfileArgs = {
  profile: ProfileInput;
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Used as placeholder as empty types aren't currently supported. */
  _base_: Scalars['String'];
  /** @deprecated Use match subscription instead */
  lobby?: Maybe<Lobby>;
  match?: Maybe<Match>;
};


export type SubscriptionLobbyArgs = {
  id?: Maybe<Scalars['ID']>;
};


export type SubscriptionMatchArgs = {
  id: Scalars['ID'];
};


export type UserInput = {
  steamid: Scalars['String'];
  name: Scalars['String'];
  twitchName: Scalars['String'];
};

export type AuthenticatedObject = {
  __typename?: 'AuthenticatedObject';
  authenticated: Scalars['Boolean'];
  user?: Maybe<UserProfile>;
};

export type SystemStatus = {
  __typename?: 'SystemStatus';
  loginDisabled?: Maybe<Scalars['Boolean']>;
  signupDisabled?: Maybe<Scalars['Boolean']>;
};

export enum LeaderboardType {
  Standard = 'STANDARD',
  Turbo = 'TURBO',
  Duos = 'DUOS'
}

export type Leaderboard = {
  __typename?: 'Leaderboard';
  type: Scalars['ID'];
  imported?: Maybe<Scalars['Float']>;
  entries?: Maybe<Array<Maybe<LeaderboardEntry>>>;
};

export type LeaderboardEntry = {
  __typename?: 'LeaderboardEntry';
  rank?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  mmr?: Maybe<Scalars['Int']>;
  steamid?: Maybe<Scalars['String']>;
  profilePicture?: Maybe<Scalars['String']>;
};

export type Lobby = {
  __typename?: 'Lobby';
  id: Scalars['ID'];
  spectatorId?: Maybe<Scalars['ID']>;
  averageMMR?: Maybe<Scalars['Int']>;
  duration?: Maybe<Scalars['String']>;
  slots?: Maybe<Array<Maybe<LobbySlot>>>;
  /** Stringified JSON pool snapshot */
  pool?: Maybe<Scalars['String']>;
};

export type LobbySlot = {
  __typename?: 'LobbySlot';
  lobbySlotId: Scalars['ID'];
  slot?: Maybe<Scalars['Int']>;
  user?: Maybe<UserProfile>;
};

export enum GameMode {
  Invalid = 'INVALID',
  Normal = 'NORMAL',
  Turbo = 'TURBO',
  Duos = 'DUOS',
  Techprototypea = 'TECHPROTOTYPEA',
  Sandbox = 'SANDBOX',
  Puzzle = 'PUZZLE',
  Tutorial = 'TUTORIAL',
  Streetfight = 'STREETFIGHT'
}

export type Match = {
  __typename?: 'Match';
  id: Scalars['ID'];
  created: Scalars['Date'];
  updated: Scalars['Date'];
  ended?: Maybe<Scalars['Date']>;
  mode?: Maybe<GameMode>;
  averageMMR?: Maybe<Scalars['Int']>;
  players?: Maybe<Array<MatchPlayerSnapshot>>;
  pool?: Maybe<Array<PoolEntry>>;
  /** @deprecated Use players instead */
  slots?: Maybe<Array<MatchSlot>>;
};

export type PoolEntry = {
  __typename?: 'PoolEntry';
  index: Scalars['Int'];
  count: Scalars['Int'];
};

export type MatchPlayerSnapshot = {
  __typename?: 'MatchPlayerSnapshot';
  id: Scalars['ID'];
  profilePicture?: Maybe<Scalars['String']>;
  mmr?: Maybe<Scalars['Int']>;
  public_player_state?: Maybe<PublicPlayerState>;
  private_player_state?: Maybe<PrivatePlayerState>;
};

export type MatchSlot = {
  __typename?: 'MatchSlot';
  /** Format: matchid#slot */
  matchSlotID: Scalars['ID'];
  slot: Scalars['Int'];
  finalPlace: Scalars['Int'];
  created: Scalars['Date'];
  updated: Scalars['Date'];
  match?: Maybe<Match>;
  /** If no user profile is returned, matchPlayer will be populated instead */
  user?: Maybe<UserProfile>;
};

export type PublicPlayerState = {
  __typename?: 'PublicPlayerState';
  player_slot: Scalars['Int'];
  account_id: Scalars['Int'];
  connection_status: Scalars['Int'];
  is_human_player?: Maybe<Scalars['Boolean']>;
  health: Scalars['Int'];
  gold: Scalars['Int'];
  level: Scalars['Int'];
  xp: Scalars['Int'];
  final_place: Scalars['Int'];
  next_level_xp: Scalars['Int'];
  sequence_number: Scalars['Int'];
  shop_cost_modifier: Scalars['Int'];
  reroll_cost_modifier: Scalars['Int'];
  win_streak: Scalars['Int'];
  lose_streak: Scalars['Int'];
  rank_tier: Scalars['Int'];
  disconnected_time: Scalars['Int'];
  platform: Scalars['Int'];
  event_tier: Scalars['Int'];
  persona_name?: Maybe<Scalars['String']>;
  wins: Scalars['Int'];
  losses: Scalars['Int'];
  player_loadout?: Maybe<Array<PlayerLoadout>>;
  net_worth: Scalars['Int'];
  /**
   * combat_result === 0 - if combat was drawn
   * combat_result === 1 - if player won
   * combat_result === 2 - if opponent won
   */
  combat_result?: Maybe<Scalars['Int']>;
  lobby_team: Scalars['Int'];
  is_mirrored_match?: Maybe<Scalars['Boolean']>;
  underlord: Scalars['Int'];
  underlord_selected_talents?: Maybe<Array<Scalars['Int']>>;
  party_index: Scalars['Int'];
  board_unit_limit: Scalars['Int'];
  combat_type: Scalars['Int'];
  board_buddy?: Maybe<BoardBuddy>;
  brawny_kills_float: Scalars['Int'];
  owns_event?: Maybe<Scalars['Boolean']>;
  city_prestige_level: Scalars['Int'];
  stat_best_victory_duration: Scalars['Int'];
  stat_best_victory_net_worth: Scalars['Int'];
  stat_best_victory_remaining_health_percent: Scalars['Int'];
  stat_best_victory_units: Scalars['Int'];
  stat_prev_victory_duration: Scalars['Int'];
  stat_prev_victory_net_worth: Scalars['Int'];
  stat_prev_victory_units: Scalars['Int'];
  global_leaderboard_rank?: Maybe<Scalars['Int']>;
  units?: Maybe<Array<Maybe<Unit>>>;
  synergies?: Maybe<Array<Synergy>>;
  combat_duration?: Maybe<Scalars['Int']>;
  opponent_player_slot?: Maybe<Scalars['Int']>;
  vs_opponent_wins?: Maybe<Scalars['Int']>;
  vs_opponent_losses?: Maybe<Scalars['Int']>;
  vs_opponent_draws?: Maybe<Scalars['Int']>;
  item_slots?: Maybe<Array<ItemSlot>>;
};

export type PrivatePlayerState = {
  __typename?: 'PrivatePlayerState';
  player_slot: Scalars['Int'];
  unclaimed_reward_count: Scalars['Int'];
  shop_locked: Scalars['Boolean'];
  shop_units?: Maybe<Array<ShopUnit>>;
  gold_earned_this_round: Scalars['Int'];
  shop_generation_id: Scalars['Int'];
  grants_rewards: Scalars['Int'];
  sequence_number: Scalars['Int'];
  reroll_cost: Scalars['Int'];
  can_select_underlord: Scalars['Boolean'];
  used_item_reward_reroll_this_round: Scalars['Boolean'];
  used_turbo_bucket_reroll?: Maybe<Scalars['Boolean']>;
  turbo_buckets?: Maybe<Array<TurboBucket>>;
  oldest_unclaimed_reward?: Maybe<OldestUnclaimedReward>;
  challenges?: Maybe<Array<Maybe<Challenge>>>;
  underlord_picker_offering?: Maybe<Array<Maybe<UnderlordPickerOffering>>>;
};

export type ShopUnit = {
  __typename?: 'ShopUnit';
  unit_id: Scalars['Int'];
  will_combine_two_stars?: Maybe<Scalars['Boolean']>;
  gold_cost?: Maybe<Scalars['Int']>;
  wanted_legendary?: Maybe<Scalars['Boolean']>;
  will_combine_three_stars?: Maybe<Scalars['Boolean']>;
  keywords?: Maybe<Array<Scalars['Int']>>;
};

export type TurboBucket = {
  __typename?: 'TurboBucket';
  unit_ids: Array<Scalars['Int']>;
  keywords?: Maybe<Array<Scalars['Int']>>;
};

export type OldestUnclaimedReward = {
  __typename?: 'OldestUnclaimedReward';
  reward_id: Scalars['Int'];
  choices?: Maybe<Array<Choice>>;
};

export type Choice = {
  __typename?: 'Choice';
  item_id: Scalars['Int'];
  available: Scalars['Boolean'];
};

export type Challenge = {
  __typename?: 'Challenge';
  slot_id: Scalars['Int'];
  sequence_id: Scalars['Int'];
  progress: Scalars['Int'];
  initial_progress: Scalars['Int'];
  claimed: Scalars['Int'];
};

export type UnderlordPickerOffering = {
  __typename?: 'UnderlordPickerOffering';
  underlord_id: Scalars['Int'];
  build_id: Scalars['Int'];
};

export type PlayerLoadout = {
  __typename?: 'PlayerLoadout';
  slot: Scalars['Int'];
  sub_slot: Scalars['Int'];
  def_index: Scalars['Int'];
};

export type BoardBuddy = {
  __typename?: 'BoardBuddy';
  desired_pos_x: Scalars['Int'];
  desired_pos_y: Scalars['Int'];
};

export type Unit = {
  __typename?: 'Unit';
  entindex: Scalars['Int'];
  unit_id: Scalars['Int'];
  position: Position;
  rank: Scalars['Int'];
  gold_value: Scalars['Int'];
  kill_count: Scalars['Int'];
  kill_streak: Scalars['Int'];
  keywords?: Maybe<Array<Scalars['Int']>>;
  duel_bonus_damage: Scalars['Int'];
  unit_cap_cost: Scalars['Int'];
  can_move_to_bench?: Maybe<Scalars['Boolean']>;
  can_be_sold?: Maybe<Scalars['Boolean']>;
  recommended_for_placement?: Maybe<Scalars['Boolean']>;
  float_kill_count: Scalars['Int'];
};

export type Position = {
  __typename?: 'Position';
  x: Scalars['Int'];
  y: Scalars['Int'];
};

export type Synergy = {
  __typename?: 'Synergy';
  keyword: Scalars['Int'];
  unique_unit_count: Scalars['Int'];
  bench_additional_unique_unit_count?: Maybe<Scalars['Int']>;
};

export type ItemSlot = {
  __typename?: 'ItemSlot';
  slot_index: Scalars['Int'];
  item_id: Scalars['Int'];
  assigned_unit_entindex?: Maybe<Scalars['Int']>;
};

export type UserProfile = {
  __typename?: 'UserProfile';
  steamid: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  profilePicture?: Maybe<Scalars['String']>;
  publicProfile?: Maybe<Scalars['Boolean']>;
  twitchName?: Maybe<Scalars['String']>;
  discordName?: Maybe<Scalars['String']>;
  standardRating?: Maybe<MmrRating>;
  turboRating?: Maybe<MmrRating>;
  duosRating?: Maybe<MmrRating>;
  matches?: Maybe<Array<Maybe<MatchSlot>>>;
  mmrHistory?: Maybe<Array<Maybe<MmrHistory>>>;
};


export type UserProfileMatchesArgs = {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
};


export type UserProfileMmrHistoryArgs = {
  startDate?: Maybe<Scalars['Date']>;
  endDate?: Maybe<Scalars['Date']>;
  duration?: Maybe<Scalars['Int']>;
  mode?: Maybe<GameMode>;
};

export type MmrRating = {
  __typename?: 'MMRRating';
  mmr?: Maybe<Scalars['Int']>;
  rank?: Maybe<Scalars['Int']>;
  rankTier?: Maybe<Scalars['Int']>;
};

export type MmrHistory = {
  __typename?: 'MMRHistory';
  date?: Maybe<Scalars['Date']>;
  mmr?: Maybe<Scalars['Int']>;
  rank?: Maybe<Scalars['Int']>;
};

export type ProfileInput = {
  steamid?: Maybe<Scalars['ID']>;
  public?: Maybe<Scalars['Boolean']>;
  unlinkTwitch?: Maybe<Scalars['Boolean']>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> = LegacyStitchingResolver<TResult, TParent, TContext, TArgs> | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  SCOPE: Scope;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Mutation: ResolverTypeWrapper<{}>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Subscription: ResolverTypeWrapper<{}>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  UserInput: UserInput;
  AuthenticatedObject: ResolverTypeWrapper<AuthenticatedObject>;
  SystemStatus: ResolverTypeWrapper<SystemStatus>;
  LeaderboardType: LeaderboardType;
  Leaderboard: ResolverTypeWrapper<Leaderboard>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  LeaderboardEntry: ResolverTypeWrapper<LeaderboardEntry>;
  Lobby: ResolverTypeWrapper<Lobby>;
  LobbySlot: ResolverTypeWrapper<LobbySlot>;
  GameMode: GameMode;
  Match: ResolverTypeWrapper<Match>;
  PoolEntry: ResolverTypeWrapper<PoolEntry>;
  MatchPlayerSnapshot: ResolverTypeWrapper<MatchPlayerSnapshot>;
  MatchSlot: ResolverTypeWrapper<MatchSlot>;
  PublicPlayerState: ResolverTypeWrapper<PublicPlayerState>;
  PrivatePlayerState: ResolverTypeWrapper<PrivatePlayerState>;
  ShopUnit: ResolverTypeWrapper<ShopUnit>;
  TurboBucket: ResolverTypeWrapper<TurboBucket>;
  OldestUnclaimedReward: ResolverTypeWrapper<OldestUnclaimedReward>;
  Choice: ResolverTypeWrapper<Choice>;
  Challenge: ResolverTypeWrapper<Challenge>;
  UnderlordPickerOffering: ResolverTypeWrapper<UnderlordPickerOffering>;
  PlayerLoadout: ResolverTypeWrapper<PlayerLoadout>;
  BoardBuddy: ResolverTypeWrapper<BoardBuddy>;
  Unit: ResolverTypeWrapper<Unit>;
  Position: ResolverTypeWrapper<Position>;
  Synergy: ResolverTypeWrapper<Synergy>;
  ItemSlot: ResolverTypeWrapper<ItemSlot>;
  UserProfile: ResolverTypeWrapper<UserProfile>;
  MMRRating: ResolverTypeWrapper<MmrRating>;
  MMRHistory: ResolverTypeWrapper<MmrHistory>;
  ProfileInput: ProfileInput;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Query: {};
  String: Scalars['String'];
  Int: Scalars['Int'];
  ID: Scalars['ID'];
  Mutation: {};
  Boolean: Scalars['Boolean'];
  Subscription: {};
  Date: Scalars['Date'];
  UserInput: UserInput;
  AuthenticatedObject: AuthenticatedObject;
  SystemStatus: SystemStatus;
  Leaderboard: Leaderboard;
  Float: Scalars['Float'];
  LeaderboardEntry: LeaderboardEntry;
  Lobby: Lobby;
  LobbySlot: LobbySlot;
  Match: Match;
  PoolEntry: PoolEntry;
  MatchPlayerSnapshot: MatchPlayerSnapshot;
  MatchSlot: MatchSlot;
  PublicPlayerState: PublicPlayerState;
  PrivatePlayerState: PrivatePlayerState;
  ShopUnit: ShopUnit;
  TurboBucket: TurboBucket;
  OldestUnclaimedReward: OldestUnclaimedReward;
  Choice: Choice;
  Challenge: Challenge;
  UnderlordPickerOffering: UnderlordPickerOffering;
  PlayerLoadout: PlayerLoadout;
  BoardBuddy: BoardBuddy;
  Unit: Unit;
  Position: Position;
  Synergy: Synergy;
  ItemSlot: ItemSlot;
  UserProfile: UserProfile;
  MMRRating: MmrRating;
  MMRHistory: MmrHistory;
  ProfileInput: ProfileInput;
}>;

export type AuthDirectiveArgs = {   requires?: Maybe<Scope>; };

export type AuthDirectiveResolver<Result, Parent, ContextType = Context, Args = AuthDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  authenticated?: Resolver<ResolversTypes['AuthenticatedObject'], ParentType, ContextType>;
  context?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  currentMatch?: Resolver<Maybe<ResolversTypes['Match']>, ParentType, ContextType>;
  currentMatches?: Resolver<Maybe<Array<Maybe<ResolversTypes['Match']>>>, ParentType, ContextType, RequireFields<QueryCurrentMatchesArgs, never>>;
  leaderboard?: Resolver<Maybe<ResolversTypes['Leaderboard']>, ParentType, ContextType, RequireFields<QueryLeaderboardArgs, 'type'>>;
  lobby?: Resolver<Maybe<ResolversTypes['Lobby']>, ParentType, ContextType, RequireFields<QueryLobbyArgs, never>>;
  match?: Resolver<Maybe<ResolversTypes['Match']>, ParentType, ContextType, RequireFields<QueryMatchArgs, 'id'>>;
  profile?: Resolver<Maybe<ResolversTypes['UserProfile']>, ParentType, ContextType, RequireFields<QueryProfileArgs, never>>;
  status?: Resolver<Maybe<ResolversTypes['SystemStatus']>, ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  _base_?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  addUser?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationAddUserArgs, 'user'>>;
  generateGsiJwt?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationGenerateGsiJwtArgs, never>>;
  removeUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRemoveUserArgs, 'steamid'>>;
  updateProfile?: Resolver<Maybe<ResolversTypes['UserProfile']>, ParentType, ContextType, RequireFields<MutationUpdateProfileArgs, 'profile'>>;
}>;

export type SubscriptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  _base_?: SubscriptionResolver<ResolversTypes['String'], "_base_", ParentType, ContextType>;
  lobby?: SubscriptionResolver<Maybe<ResolversTypes['Lobby']>, "lobby", ParentType, ContextType, RequireFields<SubscriptionLobbyArgs, never>>;
  match?: SubscriptionResolver<Maybe<ResolversTypes['Match']>, "match", ParentType, ContextType, RequireFields<SubscriptionMatchArgs, 'id'>>;
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type AuthenticatedObjectResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AuthenticatedObject'] = ResolversParentTypes['AuthenticatedObject']> = ResolversObject<{
  authenticated?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['UserProfile']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SystemStatusResolvers<ContextType = Context, ParentType extends ResolversParentTypes['SystemStatus'] = ResolversParentTypes['SystemStatus']> = ResolversObject<{
  loginDisabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  signupDisabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LeaderboardResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Leaderboard'] = ResolversParentTypes['Leaderboard']> = ResolversObject<{
  type?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imported?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  entries?: Resolver<Maybe<Array<Maybe<ResolversTypes['LeaderboardEntry']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LeaderboardEntryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['LeaderboardEntry'] = ResolversParentTypes['LeaderboardEntry']> = ResolversObject<{
  rank?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mmr?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  steamid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  profilePicture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LobbyResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Lobby'] = ResolversParentTypes['Lobby']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  spectatorId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  averageMMR?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  duration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  slots?: Resolver<Maybe<Array<Maybe<ResolversTypes['LobbySlot']>>>, ParentType, ContextType>;
  pool?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type LobbySlotResolvers<ContextType = Context, ParentType extends ResolversParentTypes['LobbySlot'] = ResolversParentTypes['LobbySlot']> = ResolversObject<{
  lobbySlotId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  slot?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['UserProfile']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MatchResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Match'] = ResolversParentTypes['Match']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  created?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  updated?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  ended?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  mode?: Resolver<Maybe<ResolversTypes['GameMode']>, ParentType, ContextType>;
  averageMMR?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  players?: Resolver<Maybe<Array<ResolversTypes['MatchPlayerSnapshot']>>, ParentType, ContextType>;
  pool?: Resolver<Maybe<Array<ResolversTypes['PoolEntry']>>, ParentType, ContextType>;
  slots?: Resolver<Maybe<Array<ResolversTypes['MatchSlot']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PoolEntryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PoolEntry'] = ResolversParentTypes['PoolEntry']> = ResolversObject<{
  index?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MatchPlayerSnapshotResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MatchPlayerSnapshot'] = ResolversParentTypes['MatchPlayerSnapshot']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  profilePicture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mmr?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  public_player_state?: Resolver<Maybe<ResolversTypes['PublicPlayerState']>, ParentType, ContextType>;
  private_player_state?: Resolver<Maybe<ResolversTypes['PrivatePlayerState']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MatchSlotResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MatchSlot'] = ResolversParentTypes['MatchSlot']> = ResolversObject<{
  matchSlotID?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  slot?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  finalPlace?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  created?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  updated?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  match?: Resolver<Maybe<ResolversTypes['Match']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['UserProfile']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PublicPlayerStateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PublicPlayerState'] = ResolversParentTypes['PublicPlayerState']> = ResolversObject<{
  player_slot?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  account_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  connection_status?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  is_human_player?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  health?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  gold?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  level?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  xp?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  final_place?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  next_level_xp?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sequence_number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  shop_cost_modifier?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  reroll_cost_modifier?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  win_streak?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  lose_streak?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rank_tier?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  disconnected_time?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  platform?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  event_tier?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  persona_name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  wins?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  losses?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  player_loadout?: Resolver<Maybe<Array<ResolversTypes['PlayerLoadout']>>, ParentType, ContextType>;
  net_worth?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  combat_result?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lobby_team?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  is_mirrored_match?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  underlord?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  underlord_selected_talents?: Resolver<Maybe<Array<ResolversTypes['Int']>>, ParentType, ContextType>;
  party_index?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  board_unit_limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  combat_type?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  board_buddy?: Resolver<Maybe<ResolversTypes['BoardBuddy']>, ParentType, ContextType>;
  brawny_kills_float?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  owns_event?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  city_prestige_level?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stat_best_victory_duration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stat_best_victory_net_worth?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stat_best_victory_remaining_health_percent?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stat_best_victory_units?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stat_prev_victory_duration?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stat_prev_victory_net_worth?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  stat_prev_victory_units?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  global_leaderboard_rank?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  units?: Resolver<Maybe<Array<Maybe<ResolversTypes['Unit']>>>, ParentType, ContextType>;
  synergies?: Resolver<Maybe<Array<ResolversTypes['Synergy']>>, ParentType, ContextType>;
  combat_duration?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  opponent_player_slot?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  vs_opponent_wins?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  vs_opponent_losses?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  vs_opponent_draws?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  item_slots?: Resolver<Maybe<Array<ResolversTypes['ItemSlot']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PrivatePlayerStateResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PrivatePlayerState'] = ResolversParentTypes['PrivatePlayerState']> = ResolversObject<{
  player_slot?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unclaimed_reward_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  shop_locked?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  shop_units?: Resolver<Maybe<Array<ResolversTypes['ShopUnit']>>, ParentType, ContextType>;
  gold_earned_this_round?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  shop_generation_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  grants_rewards?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sequence_number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  reroll_cost?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  can_select_underlord?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  used_item_reward_reroll_this_round?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  used_turbo_bucket_reroll?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  turbo_buckets?: Resolver<Maybe<Array<ResolversTypes['TurboBucket']>>, ParentType, ContextType>;
  oldest_unclaimed_reward?: Resolver<Maybe<ResolversTypes['OldestUnclaimedReward']>, ParentType, ContextType>;
  challenges?: Resolver<Maybe<Array<Maybe<ResolversTypes['Challenge']>>>, ParentType, ContextType>;
  underlord_picker_offering?: Resolver<Maybe<Array<Maybe<ResolversTypes['UnderlordPickerOffering']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ShopUnitResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ShopUnit'] = ResolversParentTypes['ShopUnit']> = ResolversObject<{
  unit_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  will_combine_two_stars?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  gold_cost?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  wanted_legendary?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  will_combine_three_stars?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  keywords?: Resolver<Maybe<Array<ResolversTypes['Int']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TurboBucketResolvers<ContextType = Context, ParentType extends ResolversParentTypes['TurboBucket'] = ResolversParentTypes['TurboBucket']> = ResolversObject<{
  unit_ids?: Resolver<Array<ResolversTypes['Int']>, ParentType, ContextType>;
  keywords?: Resolver<Maybe<Array<ResolversTypes['Int']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OldestUnclaimedRewardResolvers<ContextType = Context, ParentType extends ResolversParentTypes['OldestUnclaimedReward'] = ResolversParentTypes['OldestUnclaimedReward']> = ResolversObject<{
  reward_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  choices?: Resolver<Maybe<Array<ResolversTypes['Choice']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ChoiceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Choice'] = ResolversParentTypes['Choice']> = ResolversObject<{
  item_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  available?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ChallengeResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Challenge'] = ResolversParentTypes['Challenge']> = ResolversObject<{
  slot_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sequence_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  progress?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  initial_progress?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  claimed?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UnderlordPickerOfferingResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UnderlordPickerOffering'] = ResolversParentTypes['UnderlordPickerOffering']> = ResolversObject<{
  underlord_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  build_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PlayerLoadoutResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PlayerLoadout'] = ResolversParentTypes['PlayerLoadout']> = ResolversObject<{
  slot?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sub_slot?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  def_index?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BoardBuddyResolvers<ContextType = Context, ParentType extends ResolversParentTypes['BoardBuddy'] = ResolversParentTypes['BoardBuddy']> = ResolversObject<{
  desired_pos_x?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  desired_pos_y?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UnitResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Unit'] = ResolversParentTypes['Unit']> = ResolversObject<{
  entindex?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unit_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  position?: Resolver<ResolversTypes['Position'], ParentType, ContextType>;
  rank?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  gold_value?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  kill_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  kill_streak?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  keywords?: Resolver<Maybe<Array<ResolversTypes['Int']>>, ParentType, ContextType>;
  duel_bonus_damage?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unit_cap_cost?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  can_move_to_bench?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  can_be_sold?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  recommended_for_placement?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  float_kill_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PositionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Position'] = ResolversParentTypes['Position']> = ResolversObject<{
  x?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  y?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SynergyResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Synergy'] = ResolversParentTypes['Synergy']> = ResolversObject<{
  keyword?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unique_unit_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bench_additional_unique_unit_count?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ItemSlotResolvers<ContextType = Context, ParentType extends ResolversParentTypes['ItemSlot'] = ResolversParentTypes['ItemSlot']> = ResolversObject<{
  slot_index?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  item_id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  assigned_unit_entindex?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserProfileResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserProfile'] = ResolversParentTypes['UserProfile']> = ResolversObject<{
  steamid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  profilePicture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  publicProfile?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  twitchName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  discordName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  standardRating?: Resolver<Maybe<ResolversTypes['MMRRating']>, ParentType, ContextType>;
  turboRating?: Resolver<Maybe<ResolversTypes['MMRRating']>, ParentType, ContextType>;
  duosRating?: Resolver<Maybe<ResolversTypes['MMRRating']>, ParentType, ContextType>;
  matches?: Resolver<Maybe<Array<Maybe<ResolversTypes['MatchSlot']>>>, ParentType, ContextType, RequireFields<UserProfileMatchesArgs, never>>;
  mmrHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['MMRHistory']>>>, ParentType, ContextType, RequireFields<UserProfileMmrHistoryArgs, never>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MmrRatingResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MMRRating'] = ResolversParentTypes['MMRRating']> = ResolversObject<{
  mmr?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  rankTier?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MmrHistoryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MMRHistory'] = ResolversParentTypes['MMRHistory']> = ResolversObject<{
  date?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  mmr?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Date?: GraphQLScalarType;
  AuthenticatedObject?: AuthenticatedObjectResolvers<ContextType>;
  SystemStatus?: SystemStatusResolvers<ContextType>;
  Leaderboard?: LeaderboardResolvers<ContextType>;
  LeaderboardEntry?: LeaderboardEntryResolvers<ContextType>;
  Lobby?: LobbyResolvers<ContextType>;
  LobbySlot?: LobbySlotResolvers<ContextType>;
  Match?: MatchResolvers<ContextType>;
  PoolEntry?: PoolEntryResolvers<ContextType>;
  MatchPlayerSnapshot?: MatchPlayerSnapshotResolvers<ContextType>;
  MatchSlot?: MatchSlotResolvers<ContextType>;
  PublicPlayerState?: PublicPlayerStateResolvers<ContextType>;
  PrivatePlayerState?: PrivatePlayerStateResolvers<ContextType>;
  ShopUnit?: ShopUnitResolvers<ContextType>;
  TurboBucket?: TurboBucketResolvers<ContextType>;
  OldestUnclaimedReward?: OldestUnclaimedRewardResolvers<ContextType>;
  Choice?: ChoiceResolvers<ContextType>;
  Challenge?: ChallengeResolvers<ContextType>;
  UnderlordPickerOffering?: UnderlordPickerOfferingResolvers<ContextType>;
  PlayerLoadout?: PlayerLoadoutResolvers<ContextType>;
  BoardBuddy?: BoardBuddyResolvers<ContextType>;
  Unit?: UnitResolvers<ContextType>;
  Position?: PositionResolvers<ContextType>;
  Synergy?: SynergyResolvers<ContextType>;
  ItemSlot?: ItemSlotResolvers<ContextType>;
  UserProfile?: UserProfileResolvers<ContextType>;
  MMRRating?: MmrRatingResolvers<ContextType>;
  MMRHistory?: MmrHistoryResolvers<ContextType>;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = Context> = Resolvers<ContextType>;
export type DirectiveResolvers<ContextType = Context> = ResolversObject<{
  auth?: AuthDirectiveResolver<any, any, ContextType>;
}>;


/**
 * @deprecated
 * Use "DirectiveResolvers" root object instead. If you wish to get "IDirectiveResolvers", add "typesPrefix: I" to your config.
 */
export type IDirectiveResolvers<ContextType = Context> = DirectiveResolvers<ContextType>;