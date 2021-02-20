import Link from "next/link";

import { FunctionComponent } from "react";
import { useLobbyQuery } from "../../gql/Lobby.graphql";
import { HStack } from "../hstack";
import { NextSeo } from "next-seo";
import { mapRankTierToName } from "@shared/ranks";

export const LobbySummary: FunctionComponent<{ id?: string }> = ({ id }) => {
	const { data, loading, error, refetch } = useLobbyQuery({
		variables: { id },
	});
	const { lobby } = data ?? {};

	if (loading) return <p>Loading...</p>;

	return (
		<>
			<NextSeo
				description={`Average MMR: ${
					lobby?.averageMMR ?? 0
				}; Duration: ${lobby?.duration ?? 0}; Players: ${
					lobby?.slots?.map((slot) => slot?.user?.name) ?? ""
				}`}
				openGraph={{
					description: `Average MMR: ${
						lobby?.averageMMR ?? 0
					}; Duration: ${lobby?.duration ?? 0}; Players: ${
						lobby?.slots?.map((slot) => slot?.user?.name) ?? ""
					}`,
				}}
			/>
			{error && (
				<p>
					{error.name} - {error.message}
				</p>
			)}
			<HStack fullWidth={true} style={{ alignItems: "center" }}>
				<p>Average MMR: {lobby?.averageMMR ?? 0}</p>
				<p style={{ marginLeft: "2rem" }}>
					Duration: {lobby?.duration}
				</p>
				<button
					className="button"
					style={{ marginLeft: "auto" }}
					onClick={() => refetch({ id })}
				>
					Refresh
				</button>
			</HStack>{" "}
			<div style={{ overflowX: "auto" }}>
				<table
					className="table is-hoverable is-fullwidth"
					style={{ marginTop: "1rem", height: "100%" }}
				>
					<thead>
						<tr>
							<th>Player</th>
							<th>Rank</th>
							<th>Leaderboard Rank</th>
							<th>MMR</th>
							<th style={{ textDecoration: "line-through" }}>
								Record
							</th>
							<th style={{ textDecoration: "line-through" }}>
								Gross Income
							</th>
							<th style={{ textDecoration: "line-through" }}>
								Streak
							</th>
							<th style={{ textDecoration: "line-through" }}>
								VS-Counter
							</th>
						</tr>
					</thead>
					<tbody>
						{lobby?.slots
							?.sort((a, b) =>
								(a?.slot ?? 0) < (b?.slot ?? 0)
									? 1
									: (a?.slot ?? 0) > (b?.slot ?? 0)
									? -1
									: 0
							)
							.map((slot) => (
								<tr key={slot?.lobbySlotId}>
									<td>
										<HStack>
											<Link
												href="/profile/[[...id]]"
												as={`/profile/${
													slot?.user?.steamid ?? 0
												}`}
												passHref
											>
												<a>
													<figure
														className="image is-64x64"
														style={{
															marginRight: "2rem",
														}}
													>
														<img
															className="is-rounded"
															loading="lazy"
															src={
																slot?.user
																	?.profilePicture ??
																"https://bulma.io/images/placeholders/128x128.png"
															}
														/>
													</figure>
												</a>
											</Link>
											<Link
												href="/profile/[[...id]]"
												as={`/profile/${
													slot?.user?.steamid ?? 0
												}`}
												passHref
											>
												<a>{slot?.user?.name ?? ""}</a>
											</Link>
										</HStack>
									</td>
									<td>
										{mapRankTierToName(
											slot?.user?.standardRating
												?.rankTier ?? 0
										)}
									</td>
									<td>{slot?.user?.standardRating?.rank}</td>
									<td>{slot?.user?.standardRating?.mmr}</td>
									<td></td>
									<td></td>
									<td></td>
									<td></td>
								</tr>
							))}
					</tbody>
				</table>
			</div>
		</>
	);
};
