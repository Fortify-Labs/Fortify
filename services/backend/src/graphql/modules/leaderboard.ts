import { GQLModule } from "../../definitions/module";
import { ApolloError, gql } from "apollo-server-express";
import { inject, injectable } from "inversify";
import { LeaderboardEntry, Resolvers } from "../../definitions/graphql/types";
import { RedisConnector } from "@shared/connectors/redis";
import { PostgresConnector } from "@shared/connectors/postgres";
import {
	MappedLeaderboardEntry,
	ULLeaderboard,
} from "@shared/definitions/leaderboard";

@injectable()
export class LeaderboardModule implements GQLModule {
	constructor(
		@inject(RedisConnector) private redisConnector: RedisConnector,
		@inject(PostgresConnector) private postgresConnector: PostgresConnector,
	) {}

	typeDef = gql`
		extend type Query {
			leaderboard(type: LeaderboardType = STANDARD): Leaderboard
		}

		enum LeaderboardType {
			STANDARD
			TURBO
			DUOS
		}

		type Leaderboard {
			type: ID!

			imported: Float

			entries: [LeaderboardEntry]
		}

		type LeaderboardEntry {
			rank: Int
			name: String
			mmr: Int

			steamid: String
			profilePicture: String
		}
	`;

	resolver(): Resolvers {
		const { redisConnector, postgresConnector } = this;

		return {
			Query: {
				leaderboard: async (_parent, { type }) => {
					const leaderboardType = type.toLowerCase();

					const rawLeaderboard = await redisConnector.getAsync(
						"ul:leaderboard:" + leaderboardType,
					);
					if (!rawLeaderboard) {
						throw new ApolloError(
							`No leaderboard found for type: ${leaderboardType}`,
							"NO_LEADERBOARD_FOUND",
						);
					}
					const rawMappedLeaderboard = await redisConnector.getAsync(
						"ul:leaderboard:mapped:" + leaderboardType,
					);
					if (!rawMappedLeaderboard) {
						throw new ApolloError(
							`No mapped leaderboard found for type: ${leaderboardType}`,
							"NO_MAPPED_LEADERBOARD_FOUND",
						);
					}

					const leaderboard: ULLeaderboard = JSON.parse(
						rawLeaderboard,
					);
					const mappedLeaderboard: MappedLeaderboardEntry[] = JSON.parse(
						rawMappedLeaderboard,
					);

					const entries: LeaderboardEntry[] = leaderboard.leaderboard.map(
						(entry) => {
							const user = mappedLeaderboard.find(
								(mappedEntry) =>
									mappedEntry.mmr === entry.level_score &&
									mappedEntry.rank === entry.rank,
							);

							return {
								mmr: entry.level_score,
								rank: entry.rank,
								name: entry.name,
								steamid: user?.steamid,
							};
						},
					);

					return {
						type: leaderboardType,
						imported: leaderboard.time_posted,
						entries,
					};
				},
			},
			LeaderboardEntry: {
				profilePicture: async ({ steamid }) => {
					if (steamid) {
						const userRepo = await postgresConnector.getUserRepo();
						const user = await userRepo.findOne(steamid);
						return user?.profilePicture ?? "";
					}

					return "";
				},
			},
		};
	}
}
