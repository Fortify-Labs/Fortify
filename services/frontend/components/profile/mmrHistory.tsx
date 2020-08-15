import { FunctionComponent } from "react";
import { useProfileMmrHistoryQuery } from "../../gql/ProfileMmrHistory.graphql";
import { LineChart } from "../linechart";

export const MmrHistory: FunctionComponent<{
	steamid?: string;
}> = ({ steamid }) => {
	const { data, loading, error } = useProfileMmrHistoryQuery({
		variables: { steamid },
	});
	const { mmrHistory } = data?.profile ?? {};

	if (error) console.error(error);

	const mmrData =
		mmrHistory?.map((entry) => ({
			date: entry?.date ?? 0,
			value: entry?.mmr ?? 0,
		})) ?? [];

	const rankData =
		mmrHistory?.map((entry) => ({
			date: entry?.date ?? 0,
			value: entry?.rank ?? 0,
		})) ?? [];

	return (
		<div>
			{loading && <p>Loading...</p>}

			{!loading && (
				<>
					{mmrData.length > 0 ? (
						<LineChart yName="MMR" xName="Date" data={mmrData} />
					) : (
						<p>No MMR data points recorded</p>
					)}{" "}
					<hr />
					{rankData.length > 0 ? (
						<LineChart yName="Rank" xName="Date" data={rankData} />
					) : (
						<p>No rank data points recorded</p>
					)}
				</>
			)}
		</div>
	);
};
