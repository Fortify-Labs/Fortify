import { FunctionComponent } from "react";
import { dateFormatter } from "utils/date";
import { prettyError } from "utils/error";
import { useProfileMatchQuery } from "../../gql/ProfileMatch.graphql";

export const RecentMatchesTable: FunctionComponent<{
	steamid?: string;
}> = ({ steamid }) => {
	const { data, loading, error } = useProfileMatchQuery({
		variables: { steamid },
	});
	const { profile } = data ?? {};

	return (
		<>
			<table className="table is-fullwidth is-hoverable">
				<thead>
					<tr>
						<th>Placement</th>
						<th>Duration</th>
						<th>Average MMR</th>
						<th>Date</th>
					</tr>
				</thead>
				<tbody>
					{loading && (
						<tr>
							<td>Loading...</td>
						</tr>
					)}
					{!loading &&
						!error &&
						profile &&
						profile.matches?.map((match) => {
							const updated = new Date(match?.updated ?? 0);
							const created = new Date(match?.created ?? 0);

							const duration =
								updated.getTime() - created.getTime();

							return (
								<tr key={match?.matchSlotID}>
									<th>{match?.finalPlace}</th>
									<td>
										{!isNaN(duration) &&
											new Date(duration)
												.toISOString()
												.substr(11, 8)}{" "}
										min
									</td>
									<td>{match?.match?.averageMMR}</td>
									<td>{dateFormatter(match?.created)}</td>
								</tr>
							);
						})}
				</tbody>
			</table>
			{error && prettyError(error)}
		</>
	);
};
