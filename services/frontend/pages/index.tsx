import withApollo from "../lib/with-apollo";
import { Navbar } from "../components/navbar";

import Link from "next/link";

import classNames from "classnames";

import styles from "../css/index.module.css";
import { HStack } from "../components/hstack";
import { useAuthenticatedQuery } from "gql/Authenticated.graphql";
import { GSIModal } from "components/gsiModal";
import React, { useEffect, useState } from "react";
import { NextSeo } from "next-seo";
import { useLiveStreamsQuery } from "gql/LiveStreams.graphql";
import { useCurrentMatchesQuery } from "gql/CurrentMatches.graphql";
import { RecentMatchesTable } from "components/profile/recentMatches";

const Index = () => {
	const { data } = useAuthenticatedQuery();
	const { authenticated, user } = data?.authenticated ?? {};

	const { data: currentMatchesData } = useCurrentMatchesQuery({
		variables: {
			limit: 5,
			offset: 0,
		},
	});

	const { data: liveStreamsData } = useLiveStreamsQuery();
	const streams = liveStreamsData?.streams
		?.slice()
		.sort(
			(a, b) =>
				(a?.standardRating?.rank ?? 0) -
					(b?.standardRating?.rank ?? 0) ||
				(a?.turboRating?.rank ?? 0) - (b?.turboRating?.rank ?? 0)
		);
	const [selectedStream, setSelectedStream] = useState("");

	useEffect(() => {
		if (streams && streams.length > 0) {
			if (streams[0]?.twitchName) {
				setSelectedStream(streams[0].twitchName.slice(1));
			}
		}
	}, [streams]);

	const [gsiModalVisible, setGsiModalVisible] = useState(false);

	return (
		<>
			<NextSeo
				title="Fortify"
				description="Open Source Dota Underlords Data Platform"
				openGraph={{
					url: `${process.env.NEXT_PUBLIC_URL}`,
					title: "Fortify",
					description: "Open Source Dota Underlords Data Platform",
				}}
			/>

			<Navbar />

			<div
				style={{
					backgroundImage:
						"linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) ), url(/images/flattened-bg_jpg-min.png)",
					backgroundSize: "100%",
					backgroundRepeat: "no-repeat",
					flex: 1,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					className={classNames(
						"columns",
						"content",
						"is-multiline",
						styles.columns
					)}
					style={{ margin: "1rem" }}
				>
					<div className="column is-6" style={{ height: "100%" }}>
						<h1 className="title">Fortify</h1>
						<h1 className="subtitle is-5">
							Open Source Dota Underlords Data Platform
						</h1>
						{/* 
							Potentially some kind of blog or news here
						*/}
					</div>
					<div
						className="column is-6"
						style={{ textAlign: "center", height: "100%" }}
					>
						<h1 className="title">Live streams:</h1>
						{selectedStream && (
							<div
								id="twitch-embed"
								style={{ width: "100%", height: "85%" }}
							>
								<iframe
									src={encodeURI(
										`https://embed.twitch.tv?channel=${selectedStream}&height=100%&layout=video&parent=${
											document.location.host
										}&referrer=${encodeURI(
											document.location.origin
										)}&width=100%`
									)}
									scrolling="no"
									allow="autoplay; fullscreen"
									title="Twitch"
									sandbox="allow-modals allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
									width="100%"
									height="100%"
								/>
							</div>
						)}
						{streams && streams.length && (
							<HStack fullWidth style={{ overflowX: "scroll" }}>
								<p style={{ margin: "auto" }}>Live streams:</p>
								{streams.map((stream) => (
									<button
										key={`stream_${stream?.twitchName}`}
										className="button is-text"
										style={{ margin: "auto" }}
										onClick={() =>
											setSelectedStream(
												(
													stream?.twitchName ?? ""
												).slice(1)
											)
										}
									>
										{stream?.twitchName}
										{stream?.standardRating?.rank != null &&
											stream.standardRating.rank >=
												(stream?.turboRating?.rank ??
													0) &&
											` [Rank: ${stream?.standardRating?.rank}]`}
										{stream?.turboRating?.rank != null &&
											stream.turboRating.rank >
												(stream?.standardRating?.rank ??
													0) &&
											` [Turbo Rank: ${stream?.turboRating?.rank}]`}
									</button>
								))}
							</HStack>
						)}
						{(!streams || streams.length < 1) &&
							"Currently nobody is streaming"}
					</div>

					<div
						className="column is-6"
						style={{
							// background: "#343c3d",
							textAlign: "center",
							height: "100%",
							overflowX: "auto",
						}}
					>
						<h1 className="title">Your recent matches</h1>
						{authenticated && (
							<RecentMatchesTable
								steamid={user?.steamid}
								limit={10}
								showPagination={false}
								appendViewMoreRow={{
									steamID: user?.steamid ?? "",
								}}
							/>
						)}
						{!authenticated && (
							<table
								className="table is-fullwidth is-hoverable"
								style={{
									width: "100%",
									height: "100%",
									overflowY: "scroll",
									overflowX: "scroll",
								}}
							>
								<thead>
									<tr>
										<th>Placement</th>
										<th>Average MMR</th>
										<th>Duration</th>
										<th>Game Mode</th>
										<th>Date</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td colSpan={6}>
											<a
												href={
													process.env
														.NEXT_PUBLIC_LOGIN_URL
												}
											>
												Login to view your recent
												matches
											</a>
										</td>
									</tr>
								</tbody>
							</table>
						)}
					</div>

					<div
						className="column is-6"
						style={{ textAlign: "center", overflowX: "auto" }}
					>
						<h1 className="title">Current live matches</h1>
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
							<tbody>
								{currentMatchesData?.currentMatches?.map(
									(match, index) => {
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
											: updated.getTime() -
											  created.getTime();

										return (
											<tr key={match.id}>
												<th>{match.averageMMR}</th>
												<th>{match.mode}</th>
												<th>
													{!isNaN(duration) &&
														new Date(duration)
															.toISOString()
															.substr(11, 8)}{" "}
													min
												</th>
												<th>
													{match.slots?.map(
														(slot) => {
															const name =
																slot?.user
																	?.name ??
																"";
															return `${
																name ?? ""
															}${
																name ? "; " : ""
															}`;
														}
													)}
												</th>
												<th>
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
												</th>
											</tr>
										);
									}
								)}
								<tr>
									<td colSpan={5}>
										<Link href="/matches" passHref>
											<a>View more</a>
										</Link>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<GSIModal
				visible={gsiModalVisible}
				setVisible={setGsiModalVisible}
			/>
		</>
	);
};

export default withApollo(Index);
