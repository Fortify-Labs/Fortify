import { useRouter } from "next/router";
import Link from "next/link";
import { NextSeo } from "next-seo";
import withApollo from "lib/with-apollo";

import { BigNumber } from "bignumber.js";
import classNames from "classnames";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSteam, faTwitch } from "@fortawesome/free-brands-svg-icons";
import { Navbar } from "components/navbar";
import { VStack } from "components/vstack";
import { HStack } from "components/hstack";
import { RecentMatchesTable } from "components/profile/recentMatches";
import { MmrHistory } from "components/profile/mmrHistory";

import { useUpdateProfileMutation } from "gql/UpdateProfile.graphql";
import { useProfileQuery } from "gql/Profile.graphql";
import { useAuthenticatedQuery } from "gql/Authenticated.graphql";

const Profile = () => {
	const router = useRouter();
	const { id } = router.query;

	const { data: authenticatedData } = useAuthenticatedQuery();
	const { authenticated } = authenticatedData ?? {};

	const steamid = id
		? id.toString()
		: authenticated?.authenticated && authenticated.user
		? authenticated.user.steamid
		: undefined;

	const { data, loading, error } = useProfileQuery({
		variables: { steamid },
	});
	const { profile } = data ?? {};

	const [updateProfileMutation] = useUpdateProfileMutation();

	const tabContents = {
		matches: <RecentMatchesTable steamid={steamid} />,
		mmrHistory: <MmrHistory steamid={steamid} />,
	};
	const tab = Object.keys(tabContents).includes(
		router.query.tab?.toString() ?? ""
	)
		? (router.query.tab?.toString() as keyof typeof tabContents)
		: "matches";

	return (
		<>
			<NextSeo
				title={`${profile?.name ?? "Private"} Profile | Fortify`}
				description={`Rank: ${profile?.rank ?? 0}; MMR: ${
					profile?.mmr ?? 0
				}; Leaderboard Rank: ${profile?.leaderboardRank ?? 0}`}
				openGraph={{
					url: `${process.env.NEXT_PUBLIC_URL}/profile/${profile?.steamid}`,
					title: `${profile?.name ?? "Private"} Profile | Fortify`,
					description: `Rank: ${profile?.rank ?? 0}; MMR: ${
						profile?.mmr ?? 0
					}; Leaderboard Rank: ${profile?.leaderboardRank ?? 0}`,
					images: [
						{
							url:
								profile?.profilePicture ??
								`${process.env.NEXT_PUBLIC_URL}/favicon.ico`,
						},
					],
				}}
			/>

			<Navbar />

			{loading && <div>Loading...</div>}

			{error && (
				<p>
					{error.name} - {error.message}
				</p>
			)}

			{!loading && !error && (
				<div style={{ margin: "1rem" }}>
					<div className="columns">
						<div className="column is-narrow">
							<div className="box">
								<VStack>
									<HStack style={{ alignItems: "center" }}>
										<figure
											className="image is-96x96"
											style={{ marginRight: "2rem" }}
										>
											<img
												className="is-rounded"
												src={
													profile?.profilePicture ??
													"https://bulma.io/images/placeholders/128x128.png"
												}
											/>
										</figure>
										Username: {profile?.name} <br /> <br />
										Rank Name: {profile?.rank} <br />
										MMR: {profile?.mmr} <br />
										Rank: {profile?.leaderboardRank}
									</HStack>

									<hr />

									<div className="content">
										<label className="checkbox">
											<input
												type="checkbox"
												checked={
													profile?.publicProfile ??
													false
												}
												disabled={loading}
												onChange={async (event) => {
													const checked =
														event.target.checked;

													await updateProfileMutation(
														{
															variables: {
																profile: {
																	steamid,
																	public: checked,
																},
															},
														}
													);
												}}
											/>{" "}
											Public Player Profile
										</label>{" "}
										<hr />
										<a
											href={`https://steamcommunity.com/profiles/${new BigNumber(
												profile?.steamid ?? ""
											).plus("76561197960265728")}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<FontAwesomeIcon
												icon={faSteam}
												size="1x"
											/>{" "}
											Steam
										</a>{" "}
										<br /> <br />
										{profile?.twitchName && (
											<>
												<a
													href={`https://twitch.tv/${profile?.twitchName.replace(
														"#",
														""
													)}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													<FontAwesomeIcon
														icon={faTwitch}
														size="1x"
													/>{" "}
													Twitch
												</a>
												<br />
												<button
													className="button is-text"
													onClick={async () => {
														await updateProfileMutation(
															{
																variables: {
																	profile: {
																		steamid,
																		unlinkTwitch: true,
																	},
																},
															}
														);
													}}
												>
													Unlink Twitch account
												</button>
												<br />
											</>
										)}
										{!profile?.twitchName &&
											((!id &&
												authenticated?.authenticated) ||
												id ==
													authenticated?.user
														?.steamid) && (
												<>
													<a
														href={
															process.env
																.NEXT_PUBLIC_TWITCH_LOGIN_URL
														}
														rel="noopener noreferrer"
													>
														<FontAwesomeIcon
															icon={faTwitch}
															size="1x"
														/>{" "}
														Link your Twitch Account
													</a>
													<br />
												</>
											)}
										{/* <a
											href=""
											target="_blank"
											rel="noopener noreferrer"
											style={{
												marginLeft: "1rem",
											}}
										>
											Discord
										</a> */}
									</div>
								</VStack>
							</div>
						</div>

						<div className="column">
							<div className="box">
								<div className="tabs">
									<ul>
										<li
											className={classNames({
												"is-active": tab == "matches",
											})}
										>
											<Link
												href="/profile/[[...id]]?tab=matches"
												as={`/profile/${steamid}?tab=matches`}
												passHref
											>
												<a>Recent Matches</a>
											</Link>
										</li>
										<li
											className={classNames({
												"is-active":
													tab == "mmrHistory",
											})}
										>
											<Link
												href="/profile/[[...id]]?tab=mmrHistory"
												as={`/profile/${steamid}?tab=mmrHistory`}
												passHref
											>
												<a>MMR / Rank History</a>
											</Link>
										</li>
									</ul>
								</div>

								<div className="content">
									{tabContents[tab]}
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default withApollo(Profile);
