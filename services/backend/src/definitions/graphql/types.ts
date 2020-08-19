/**
 * THIS IS A GENERATED FILE, DO NOT MODIFY DIRECTLY
 */

import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Context } from '@shared/auth';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };

// Generated on 2020-08-19T19:38:55+02:00

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
  currentMatches?: Maybe<Array<Maybe<Match>>>;
  lobby?: Maybe<Lobby>;
  profile?: Maybe<UserProfile>;
  status?: Maybe<SystemStatus>;
  /** Returns the current package.json version */
  version: Scalars['String'];
};


export type QueryCurrentMatchesArgs = {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
};


export type QueryLobbyArgs = {
  id?: Maybe<Scalars['ID']>;
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
  lobby?: Maybe<Lobby>;
};


export type SubscriptionLobbyArgs = {
  id?: Maybe<Scalars['ID']>;
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

export type Lobby = {
  __typename?: 'Lobby';
  id: Scalars['ID'];
  spectatorId?: Maybe<Scalars['ID']>;
  averageMMR?: Maybe<Scalars['Int']>;
  duration?: Maybe<Scalars['String']>;
  slots?: Maybe<Array<Maybe<LobbySlot>>>;
  /** Stringified pool snapshot */
  pool?: Maybe<Scalars['String']>;
};

export type LobbySlot = {
  __typename?: 'LobbySlot';
  lobbySlotId: Scalars['ID'];
  slot?: Maybe<Scalars['Int']>;
  user?: Maybe<UserProfile>;
};

export type Match = {
  __typename?: 'Match';
  id: Scalars['ID'];
  averageMMR?: Maybe<Scalars['Int']>;
  duration?: Maybe<Scalars['String']>;
  slots?: Maybe<Array<Maybe<MatchSlot>>>;
};

export type MatchSlot = {
  __typename?: 'MatchSlot';
  /** Format: matchid#slot */
  matchSlotID: Scalars['ID'];
  slot: Scalars['Int'];
  finalPlace: Scalars['Int'];
  duration?: Maybe<Scalars['String']>;
  match?: Maybe<Match>;
  /** If no user profile is returned, matchPlayer will be populated instead */
  user?: Maybe<UserProfile>;
};

export type UserProfile = {
  __typename?: 'UserProfile';
  steamid: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  profilePicture?: Maybe<Scalars['String']>;
  publicProfile?: Maybe<Scalars['Boolean']>;
  mmr?: Maybe<Scalars['Int']>;
  leaderboardRank?: Maybe<Scalars['Int']>;
  rank?: Maybe<Scalars['String']>;
  twitchName?: Maybe<Scalars['String']>;
  discordName?: Maybe<Scalars['String']>;
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

export type IsTypeOfResolverFn<T = {}> = (obj: T, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

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
  Lobby: ResolverTypeWrapper<Lobby>;
  LobbySlot: ResolverTypeWrapper<LobbySlot>;
  Match: ResolverTypeWrapper<Match>;
  MatchSlot: ResolverTypeWrapper<MatchSlot>;
  UserProfile: ResolverTypeWrapper<UserProfile>;
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
  Lobby: Lobby;
  LobbySlot: LobbySlot;
  Match: Match;
  MatchSlot: MatchSlot;
  UserProfile: UserProfile;
  MMRHistory: MmrHistory;
  ProfileInput: ProfileInput;
}>;

export type AuthDirectiveArgs = {   requires?: Maybe<Scope>; };

export type AuthDirectiveResolver<Result, Parent, ContextType = Context, Args = AuthDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  authenticated?: Resolver<ResolversTypes['AuthenticatedObject'], ParentType, ContextType>;
  context?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  currentMatches?: Resolver<Maybe<Array<Maybe<ResolversTypes['Match']>>>, ParentType, ContextType, RequireFields<QueryCurrentMatchesArgs, never>>;
  lobby?: Resolver<Maybe<ResolversTypes['Lobby']>, ParentType, ContextType, RequireFields<QueryLobbyArgs, never>>;
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
}>;

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type AuthenticatedObjectResolvers<ContextType = Context, ParentType extends ResolversParentTypes['AuthenticatedObject'] = ResolversParentTypes['AuthenticatedObject']> = ResolversObject<{
  authenticated?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['UserProfile']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type SystemStatusResolvers<ContextType = Context, ParentType extends ResolversParentTypes['SystemStatus'] = ResolversParentTypes['SystemStatus']> = ResolversObject<{
  loginDisabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  signupDisabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type LobbyResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Lobby'] = ResolversParentTypes['Lobby']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  spectatorId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  averageMMR?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  duration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  slots?: Resolver<Maybe<Array<Maybe<ResolversTypes['LobbySlot']>>>, ParentType, ContextType>;
  pool?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type LobbySlotResolvers<ContextType = Context, ParentType extends ResolversParentTypes['LobbySlot'] = ResolversParentTypes['LobbySlot']> = ResolversObject<{
  lobbySlotId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  slot?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['UserProfile']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type MatchResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Match'] = ResolversParentTypes['Match']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  averageMMR?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  duration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  slots?: Resolver<Maybe<Array<Maybe<ResolversTypes['MatchSlot']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type MatchSlotResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MatchSlot'] = ResolversParentTypes['MatchSlot']> = ResolversObject<{
  matchSlotID?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  slot?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  finalPlace?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  duration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  match?: Resolver<Maybe<ResolversTypes['Match']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['UserProfile']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type UserProfileResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UserProfile'] = ResolversParentTypes['UserProfile']> = ResolversObject<{
  steamid?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  profilePicture?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  publicProfile?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  mmr?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  leaderboardRank?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  twitchName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  discordName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  matches?: Resolver<Maybe<Array<Maybe<ResolversTypes['MatchSlot']>>>, ParentType, ContextType, RequireFields<UserProfileMatchesArgs, never>>;
  mmrHistory?: Resolver<Maybe<Array<Maybe<ResolversTypes['MMRHistory']>>>, ParentType, ContextType, RequireFields<UserProfileMmrHistoryArgs, never>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type MmrHistoryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MMRHistory'] = ResolversParentTypes['MMRHistory']> = ResolversObject<{
  date?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  mmr?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  rank?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
}>;

export type Resolvers<ContextType = Context> = ResolversObject<{
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Date?: GraphQLScalarType;
  AuthenticatedObject?: AuthenticatedObjectResolvers<ContextType>;
  SystemStatus?: SystemStatusResolvers<ContextType>;
  Lobby?: LobbyResolvers<ContextType>;
  LobbySlot?: LobbySlotResolvers<ContextType>;
  Match?: MatchResolvers<ContextType>;
  MatchSlot?: MatchSlotResolvers<ContextType>;
  UserProfile?: UserProfileResolvers<ContextType>;
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