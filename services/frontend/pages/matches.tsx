import withApollo from "../lib/with-apollo";
import { Navbar } from "../components/navbar";
import { useCurrentMatchesQuery } from "../gql/CurrentMatches.graphql";
import { NextSeo } from "next-seo";
import { prettyError } from "utils/error";
import Link from "next/link";
import { HStack } from "components/hstack";
import { VStack } from "components/vstack";
import Image from "next/image";
import { mapRankTierToAssetName } from "@shared/ranks";

const Matches = () => {
	const { loading, data, error } = useCurrentMatchesQuery({
		variables: {
			limit: 50,
			offset: 0,
		},
	});

	return (
		<>
			<NextSeo
				title="Matches | Fortify"
				description="Currently ongoing Dota Underlords matches"
				openGraph={{
					url: `${process.env.NEXT_PUBLIC_URL}/matches`,
					title: "Matches | Fortify",
					description: "Currently ongoing Dota Underlords matches",
				}}
			/>

			<Navbar />

			<div
				style={{
					margin: "1rem",
				}}
			>
				<div className="tabs">
					<ul>
						<li className="is-active">
							<a>Live Matches</a>
						</li>
						<li>
							<a style={{ textDecoration: "line-through" }}>
								Past Matches
							</a>
						</li>
					</ul>
				</div>

				<div style={{ overflowX: "auto" }}>
					<table className="table is-fullwidth is-hoverable">
						<thead>
							<tr>
								<th>Average MMR</th>
								<th>Game Mode</th>
								<th>Duration</th>
								<th>Notable Players</th>
								<th></th>
							</tr>
						</thead>
						{loading && (
							<tbody>
								<tr>
									<th>Loading...</th>
								</tr>
							</tbody>
						)}
						{error && prettyError(error)}
						{!loading && (
							<tbody>
								{data?.currentMatches?.map((match, index) => {
									if (!match) {
										return (
											<tr
												key={`unknown-match-${index}`}
											></tr>
										);
									}

									const created = new Date(match.created);
									const updated = new Date(match.updated);

									const duration = match.ended
										? new Date(match.ended).getTime() -
										  created.getTime()
										: updated.getTime() - created.getTime();

									return (
										<tr key={match.id}>
											<td>{match.averageMMR}</td>
											<td>{match.mode}</td>
											<td>
												{!isNaN(duration) &&
													new Date(duration)
														.toISOString()
														.substr(11, 8)}{" "}
												min
											</td>
											<td>
												<HStack>
													{match.slots?.map(
														(slot) => {
															const name =
																slot?.user
																	?.name ??
																"";

															const rating =
																match.mode?.toLowerCase() ==
																"normal"
																	? slot.user
																			?.standardRating
																	: slot.user
																			?.turboRating;

															return (
																<VStack
																	key={`user_${slot.user?.steamid}`}
																	style={{
																		textAlign:
																			"start",

																		marginRight:
																			"2em",
																	}}
																>
																	{name}{" "}
																	<br />
																	<Image
																		src={`/underlords/panorama/images/mini_profile/${mapRankTierToAssetName(
																			rating?.rankTier ??
																				0
																		)}`}
																		loading="lazy"
																		width="68"
																		height="100"
																		layout="fixed"
																	/>
																	Rank:{" "}
																	{
																		rating?.rank
																	}
																</VStack>
															);
														}
													)}
												</HStack>
											</td>
											<td>
												{match && (
													<Link
														href="/match/[[...id]]"
														as={`/match/${
															match.id ?? 0
														}`}
														passHref
													>
														<a>View Match</a>
													</Link>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						)}
					</table>
				</div>
			</div>
		</>
	);
};

export default withApollo(Matches);
