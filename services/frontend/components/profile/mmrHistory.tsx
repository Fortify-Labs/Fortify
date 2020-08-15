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

	return (
		<div>
			{loading && <p>Loading...</p>}

			{!loading && (
				<>
					<LineChart
						yName="MMR"
						xName="Date"
						data={
							mmrHistory?.map((entry) => ({
								date: entry?.date ?? 0,
								value: entry?.mmr ?? 0,
							})) ?? []
						}
					/>{" "}
					<br />
					<LineChart
						yName="Rank"
						xName="Date"
						data={
							mmrHistory?.map((entry) => ({
								date: entry?.date ?? 0,
								value: entry?.rank ?? 0,
							})) ?? []
						}
					/>
				</>
			)}
		</div>
	);
};
