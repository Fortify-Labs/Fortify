import withApollo from "../lib/with-apollo";
import { Navbar } from "../components/navbar";
import { useCurrentMatchesQuery } from "../gql/CurrentMatches.graphql";
import { NextSeo } from "next-seo";
import { prettyError } from "utils/error";
import Link from "next/link";

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
					<table className="table is-fullwidth is-hoverable is-striped">
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
												{match.slots?.map((slot) => {
													const name =
														slot?.user?.name ?? "";
													return `${name ?? ""}${
														name ? "; " : ""
													}`;
												})}
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
