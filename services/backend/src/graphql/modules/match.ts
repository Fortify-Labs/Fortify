import { GQLModule } from "definitions/module";
import { gql } from "apollo-server-express";
import { Resolvers } from "definitions/graphql/types";
import { injectable, inject } from "inversify";
import { PostgresConnector } from "@shared/connectors/postgres";

@injectable()
export class MatchModule implements GQLModule {
	constructor(
		@inject(PostgresConnector) private postgres: PostgresConnector,
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
		}

		type Match {
			id: ID!

			averageMMR: Int
			# round: Int
			duration: String

			slots: [MatchSlot]
		}

		type MatchSlot {
			"Format: matchid#slot"
			matchSlotID: ID!

			slot: Int!
			finalPlace: Int!

			duration: String

			match: Match
			"If no user profile is returned, matchPlayer will be populated instead"
			user: UserProfile
			matchPlayer: MatchPlayer
		}

		type MatchPlayer {
			steamid: ID!
		}
	`;

	resolver(): Resolvers {
		const { postgres } = this;

		return {
			Query: {
				async currentMatches(parent, args) {
					const limit =
						(args.limit ?? 0) <= 50 ? args.limit ?? 25 : 50;
					const offset = args.offset ?? 0;

					const matchRepo = await postgres.getMatchRepo();
					const currentMatches = await matchRepo.find({
						where: { ended: null },
						order: {
							created: "DESC",
						},
						relations: ["slots", "slots.user", "slots.matchPlayer"],
						take: limit,
						skip: offset,
					});

					return currentMatches.map((match) => ({
						...match,
						slots: match.slots.map(
							({ slot, finalPlace, user, matchPlayer }) => ({
								matchSlotID: match.id + "#" + slot,
								slot,
								finalPlace,
								user,
								matchPlayer,
							}),
						),
					}));
				},
			},
			Match: {
				async duration(parent) {
					if (parent.duration) return parent.duration;

					const matchRepo = await postgres.getMatchRepo();
					const match = await matchRepo.findOneOrFail(parent.id);

					const now = new Date();
					const utc = new Date(
						now.getTime() + now.getTimezoneOffset() * 60000,
					);

					const duration =
						(match.ended ?? utc).getTime() -
						match.created.getTime();

					return `${new Date(duration)
						.toISOString()
						.substr(11, 8)} min`;
				},
			},
			MatchSlot: {
				async duration(parent) {
					if (parent.duration) return parent.duration;

					// Calculate: created - (ended ?? now)
					const [matchID, slot] = parent.matchSlotID.split("#");

					const matchSlotRepo = await postgres.getMatchSlotRepo();
					const matchSlot = await matchSlotRepo.findOneOrFail({
						where: {
							slot,
							match: { id: matchID },
						},
					});

					const now = new Date();
					const utc = new Date(
						now.getTime() + now.getTimezoneOffset() * 60000,
					);

					const duration =
						(matchSlot.finalPlace !== 0
							? matchSlot.updated
							: utc
						).getTime() - matchSlot.created.getTime();

					return `${new Date(duration)
						.toISOString()
						.substr(11, 8)} min`;
				},
				async match(parent) {
					if (parent.match) return parent.match;

					const [matchID] = parent.matchSlotID.split("#");

					const matchRepo = await postgres.getMatchRepo();
					const match = await matchRepo.findOneOrFail(matchID, {
						relations: ["slots", "slots.user", "slots.matchPlayer"],
					});

					return {
						...match,
						slots: match.slots.map(({ slot, finalPlace }) => ({
							matchSlotID: matchID + "#" + slot,
							slot,
							finalPlace,
						})),
					};
				},
				async user(parent) {
					if (parent.user) return parent.user;
					if (!parent.user && parent.matchPlayer) return null;

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
				async matchPlayer(parent) {
					if (parent.matchPlayer) return parent.matchPlayer;
					if (!parent.matchPlayer && parent.user) return null;

					const [matchID, slot] = parent.matchSlotID.split("#");

					const matchSlotRepo = await postgres.getMatchSlotRepo();
					const matchSlot = await matchSlotRepo.findOneOrFail({
						where: {
							match: { id: matchID },
							slot,
						},
						relations: ["matchPlayer"],
					});

					return matchSlot.matchPlayer ?? null;
				},
			},
		};
	}
}
