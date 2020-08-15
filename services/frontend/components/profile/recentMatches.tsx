import { FunctionComponent } from "react";
import { useProfileMatchQuery } from "../../gql/ProfileMatch.graphql";

export const RecentMatchesTable: FunctionComponent<{
	steamid?: string;
}> = ({ steamid }) => {
	const { data, loading, error } = useProfileMatchQuery({
		variables: { steamid },
	});
	const { profile } = data ?? {};

	if (error) console.error(error);

	return (
		<table className="table is-fullwidth is-hoverable is-striped">
			<thead>
				<tr>
					<th>Placement</th>
					<th>Duration</th>
					<th>Average MMR</th>
					<th style={{ textDecoration: "line-through" }}>
						Final Lineup
					</th>
				</tr>
			</thead>
			<tbody>
				{loading && (
					<tr>
						<td>Loading...</td>
					</tr>
				)}
				{!loading &&
					profile &&
					profile.matches?.map((match) => (
						<tr key={match?.matchSlotID}>
							<th>{match?.finalPlace}</th>
							<td>{match?.duration}</td>
							<td>{match?.match?.averageMMR}</td>
							<td></td>
						</tr>
					))}
			</tbody>
		</table>
	);
};
