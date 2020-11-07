import classNames from "classnames";
import { HStack } from "components/hstack";
import { Navbar } from "components/navbar";
import { LeaderboardType, useLeaderboardQuery } from "gql/Leaderboard.graphql";
import withApollo from "lib/with-apollo";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { FunctionComponent } from "react";

const LeaderboardPage = () => {
	const { query } = useRouter();

	let leaderboard = (query.leaderboard ?? ["standard"])[0];
	leaderboard =
		leaderboard[0].toUpperCase() +
		(leaderboard as string).slice(1).toLowerCase();

	const { data, loading, error } = useLeaderboardQuery({
		variables: {
			type:
				LeaderboardType[leaderboard as keyof typeof LeaderboardType] ||
				LeaderboardType.Standard,
		},
	});

	return (
		<>
			<NextSeo
				title={`${leaderboard} Leaderboard | Fortify`}
				description={`${leaderboard} Leaderboard for Dota Underlords`}
				openGraph={{
					url: `${process.env.NEXT_PUBLIC_URL}/leaderboard/${leaderboard}`,
					title: `${leaderboard} Leaderboard | Fortify`,
					description: `${leaderboard} Leaderboard for Dota Underlords`,
				}}
			/>
			<Navbar />

			<div style={{ margin: "1rem" }}>
				<div className="columns">
					<div className="column">
						<div className="box">
							<div className="tabs">
								<ul>
									<li
										className={classNames({
											"is-active":
												leaderboard === "Standard",
										})}
									>
										<Link
											href="/leaderboard/[[...leaderboard]]"
											as={`/leaderboard/standard`}
											passHref
										>
											<a>Standard</a>
										</Link>
									</li>
									<li
										className={classNames({
											"is-active":
												leaderboard === "Turbo",
										})}
									>
										<Link
											href="/leaderboard/[[...leaderboard]]"
											as={`/leaderboard/turbo`}
											passHref
										>
											<a>Turbo</a>
										</Link>
									</li>
									<li
										className={classNames({
											"is-active": leaderboard === "Duos",
										})}
									>
										<Link
											href="/leaderboard/[[...leaderboard]]"
											as={`/leaderboard/duos`}
											passHref
										>
											<a>Duos</a>
										</Link>
									</li>
								</ul>
							</div>
							<div
								className="content"
								style={{
									overflowX: "auto",
									marginTop: "-1rem",
								}}
							>
								{loading && <p>Loading...</p>}
								{error && <pre>{error.message}</pre>}
								{data && (
									<table
										className="table is-hoverable is-fullwidth"
										style={{
											marginTop: "1rem",
											height: "100%",
										}}
									>
										<thead>
											<tr>
												<th>Rank</th>
												<th>Name</th>
												<th>MMR</th>
											</tr>
										</thead>
										<tbody>
											{data?.leaderboard?.entries?.map(
												(entry, index) => {
													const tableData = (
														Wrapper: FunctionComponent
													) => (
														<tr key={"tr" + index}>
															<td>
																<Wrapper>
																	{
																		entry?.rank
																	}
																</Wrapper>
															</td>
															<td>
																<Wrapper>
																	<HStack>
																		<figure
																			className="image is-64x64"
																			style={{
																				marginRight:
																					"2rem",
																			}}
																		>
																			<img
																				className="is-rounded"
																				src={
																					entry?.profilePicture ||
																					"https://bulma.io/images/placeholders/128x128.png"
																				}
																				loading="lazy"
																			/>
																		</figure>
																		{
																			entry?.name
																		}
																	</HStack>
																</Wrapper>
															</td>
															<td>
																<Wrapper>
																	{entry?.mmr}
																</Wrapper>
															</td>
														</tr>
													);

													if (entry?.steamid) {
														const wrapper: FunctionComponent = ({
															children,
														}) => {
															return (
																<Link
																	href="/profile/[[...id]]"
																	as={`/profile/${entry.steamid}`}
																	passHref
																	key={
																		"link" +
																		index
																	}
																>
																	<a>
																		{
																			children
																		}
																	</a>
																</Link>
															);
														};

														return (
															<Link
																href="/profile/[[...id]]"
																as={`/profile/${entry.steamid}`}
																passHref
																key={
																	"link" +
																	index
																}
															>
																{tableData(
																	wrapper
																)}
															</Link>
														);
													} else {
														return tableData(
															({ children }) => (
																<>{children}</>
															)
														);
													}
												}
											)}
										</tbody>
									</table>
								)}
							</div>
							{data?.leaderboard?.imported &&
								"Last imported: " +
									new Date(data.leaderboard.imported * 1000)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default withApollo(LeaderboardPage);
