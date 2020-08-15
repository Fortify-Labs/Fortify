import { FunctionComponent } from "react";
import { useLobbyQuery } from "../../gql/Lobby.graphql";
import { HStack } from "../hstack";

export const LobbySummary: FunctionComponent<{ id?: string }> = ({ id }) => {
	const { data, loading, error } = useLobbyQuery({ variables: { id } });
	const { lobby } = data ?? {};

	if (error) console.error(error);

	if (loading) return <p>Loading...</p>;

	return (
		<>
			{error && (
				<p>
					{error.name} - {error.message}
				</p>
			)}
			<HStack>
				<p>Average MMR: {lobby?.averageMMR ?? 0}</p>
				<p style={{ marginLeft: "2rem" }}>
					Duration: {lobby?.duration}
				</p>
			</HStack>{" "}
			<table
				className="table is-striped is-hoverable is-fullwidth"
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
					{lobby?.slots?.map((slot) => (
						<tr key={slot?.lobbySlotId}>
							<td>
								<HStack>
									<figure
										className="image is-64x64"
										style={{ marginRight: "2rem" }}
									>
										<img
											className="is-rounded"
											src={
												slot?.user?.profilePicture ??
												"https://bulma.io/images/placeholders/128x128.png"
											}
										/>
									</figure>
									{slot?.user?.name ?? ""}
								</HStack>
							</td>
							<td>{slot?.user?.rank}</td>
							<td>{slot?.user?.leaderboardRank}</td>
							<td>{slot?.user?.mmr}</td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
};
