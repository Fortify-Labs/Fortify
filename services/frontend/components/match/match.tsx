import Gauge from "components/gauge";
import { HStack } from "components/hstack";
import { MatchComponentProps } from "definitions/match";
import { useMatchQuery } from "gql/Match.graphql";
import Link from "next/link";
import React, { FunctionComponent } from "react";
import { mapRankTierToAssetName } from "@shared/ranks";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

export const MatchSummary: FunctionComponent<MatchComponentProps> = ({
	id,
}) => {
	const { data } = useMatchQuery({
		variables: { id },
		errorPolicy: "ignore",
	});

	return (
		<div style={{ overflowX: "auto", overflowY: "auto" }}>
			<table className="table is-hoverable is-fullwidth">
				<thead>
					<tr style={{ textAlign: "center" }}>
						<th>Place</th>
						<th>Player</th>
						<th>Rank</th>
						<th>MMR</th>
						<th>Health</th>
						<th>Gold</th>
						<th>Net Worth</th>
						<th>Level</th>
						<th>XP</th>
						<th>Wins - Losses</th>
						<th>Streaks</th>
					</tr>
				</thead>
				<tbody>
					{data?.match?.players
						?.map((player) => ({
							...(player.public_player_state ?? {}),
							mmr: player.mmr,
							profilePicture: player.profilePicture,
						}))
						?.sort((a, b) => {
							// Sort primarily by final place, secondary by slot number
							let outcome =
								(a?.final_place ?? 0) - (b?.final_place ?? 0);

							if (!outcome) {
								outcome = (b.health ?? 0) - (a.health ?? 0);
							}

							return outcome;
						})
						.map((slot) => (
							<tr
								key={slot?.account_id}
								style={{
									textAlign: "center",
								}}
							>
								<td
									className="is-narrow"
									style={{ verticalAlign: "middle" }}
								>
									{slot.final_place}
								</td>
								<td
									className="is-narrow"
									style={{
										textAlign: "start",
										verticalAlign: "middle",
									}}
								>
									<HStack>
										<Link
											href="/profile/[[...id]]"
											as={`/profile/${
												slot?.account_id ?? 0
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
															slot?.profilePicture ||
															"https://bulma.io/images/placeholders/128x128.png"
														}
													/>
												</figure>
											</a>
										</Link>
										<Link
											href="/profile/[[...id]]"
											as={`/profile/${
												slot?.account_id ?? 0
											}`}
											passHref
										>
											<a>{slot?.persona_name ?? ""}</a>
										</Link>
									</HStack>
								</td>
								<td
									className="is-narrow"
									style={{
										textAlign: "center",
										verticalAlign: "middle",
									}}
								>
									<Image
										src={`/underlords/panorama/images/mini_profile/${mapRankTierToAssetName(
											slot.rank_tier ?? 0
										)}`}
										loading="lazy"
										width="68"
										height="100"
									/>
									{slot?.global_leaderboard_rank && (
										<>
											<br />
											<p style={{ marginTop: "-7%" }}>
												{slot?.global_leaderboard_rank}
											</p>
										</>
									)}
								</td>
								<td
									className="is-narrow"
									style={{ verticalAlign: "middle" }}
								>
									{slot.mmr}
								</td>
								<td
									className="is-narrow"
									style={{ verticalAlign: "middle" }}
								>
									{slot.health}{" "}
									<FontAwesomeIcon
										icon={faHeart}
										width="1em"
										height="1em"
										size="1x"
									/>
								</td>
								<td
									className="is-narrow"
									style={{ verticalAlign: "middle" }}
								>
									{slot.gold}{" "}
									<Image
										src={`/underlords/panorama/images/leaderboard/icon_gold_bevel_psd.png`}
										loading="lazy"
										width="16"
										height="16"
									/>
								</td>
								<td
									className="is-narrow"
									style={{ verticalAlign: "middle" }}
								>
									{slot.net_worth}{" "}
									<Image
										src={`/underlords/panorama/images/leaderboard/icon_gold_bevel_psd.png`}
										loading="lazy"
										width="16"
										height="16"
									/>
								</td>
								<td
									className="is-narrow"
									style={{ verticalAlign: "middle" }}
								>
									{slot.level}
								</td>
								<td
									className="is-narrow"
									style={{
										verticalAlign: "middle",
									}}
								>
									{slot &&
										slot.next_level_xp != null &&
										slot.xp != null && (
											<Gauge
												max={
													slot.next_level_xp > 0
														? slot.next_level_xp
														: 1
												}
												value={slot.xp}
											/>
										)}
								</td>
								<td
									className="is-narrow"
									style={{ verticalAlign: "middle" }}
								>
									{slot.wins ?? 0} - {slot.losses ?? 0}
								</td>
								<td
									className="is-narrow"
									style={{ verticalAlign: "middle" }}
								>
									{(slot.win_streak ?? 0) > 2 ? (
										<p>Win streak: {slot.win_streak}</p>
									) : (
										<></>
									)}
									{(slot.lose_streak ?? 0) > 2 ? (
										<p>Lose streak: {slot.lose_streak}</p>
									) : (
										<></>
									)}
								</td>
							</tr>
						))}
				</tbody>
			</table>
		</div>
	);
};
