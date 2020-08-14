import withApollo from "../lib/with-apollo";
import { Navbar } from "../components/navbar";
import { useCurrentMatchesQuery } from "../gql/CurrentMatches.graphql";

const Matches = () => {
	const { loading, data, error } = useCurrentMatchesQuery({
		variables: {
			limit: 50,
			offset: 0,
		},
	});

	if (error) {
		console.error(error);
	}

	return (
		<>
			<Navbar />

			{loading && <p>Loading...</p>}

			<div
				style={{
					marginLeft: "1rem",
					marginRight: "1rem",
					marginTop: "1rem",
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

				<table className="table is-fullwidth is-hoverable is-striped">
					<thead>
						<tr>
							<th>Average MMR</th>
							<th style={{ textDecoration: "line-through" }}>
								Round
							</th>
							<th>Duration</th>
							<th>Notable Players</th>
						</tr>
					</thead>
					{loading && (
						<tbody>
							<tr>
								<th>Loading...</th>
							</tr>
						</tbody>
					)}
					{!loading && (
						<tbody>
							{data?.currentMatches?.map((match) => (
								<tr key={match?.id}>
									<th>{match?.averageMMR}</th>
									<th></th>
									<th>{match?.duration}</th>
									<th>
										{match?.slots?.map((slot) => {
											const name =
												slot?.user?.name ??
												slot?.matchPlayer?.name;
											return `${name ?? ""}${
												name ? "; " : ""
											}`;
										})}
									</th>
								</tr>
							))}
						</tbody>
					)}
				</table>
			</div>
		</>
	);
};

export default withApollo(Matches);
