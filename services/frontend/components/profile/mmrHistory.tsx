import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { FunctionComponent } from "react";
import { prettyError } from "utils/error";

import {
	GameMode,
	useProfileMmrHistoryQuery,
} from "../../gql/ProfileMmrHistory.graphql";
import { ChartData, Line } from "react-chartjs-2";

export const MmrHistory: FunctionComponent<{
	steamid?: string;
}> = ({ steamid }) => {
	const { query } = useRouter();
	const mode =
		GameMode[query.mode as keyof typeof GameMode] || GameMode.Normal;

	const { data, loading, error } = useProfileMmrHistoryQuery({
		variables: {
			steamid,
			mode,
		},
	});
	const { mmrHistory = [] } = data?.profile ?? {};

	const mmrData: ChartData<Chart.ChartData> = {
		labels: mmrHistory?.map((entry) => new Date(entry?.date).toUTCString()),
		datasets: [
			{
				label: "MMR",
				type: "line",
				data: mmrHistory?.map((entry) => entry?.mmr),
				borderColor: "#375a7f",
				backgroundColor: "#375a7f",
				pointBorderColor: "#375a7f",
				pointBackgroundColor: "#375a7f",
				pointHoverBackgroundColor: "#375a7f",
				pointHoverBorderColor: "#375a7f",
				yAxisID: "y-axis-1",
			},
			{
				label: "Rank",
				type: "line",
				data: mmrHistory?.map((entry) => entry?.rank),
				borderColor: "#1abc9c",
				backgroundColor: "#1abc9c",
				pointBorderColor: "#1abc9c",
				pointBackgroundColor: "#1abc9c",
				pointHoverBackgroundColor: "#1abc9c",
				pointHoverBorderColor: "#1abc9c",
				yAxisID: "y-axis-2",
			},
		],
	};

	const options: Chart.ChartOptions = {
		responsive: true,
		tooltips: {
			mode: "label",
		},
		elements: {
			line: {
				fill: false,
			},
		},
		scales: {
			xAxes: [
				{
					display: true,
					gridLines: {
						display: false,
					},
					stacked: false,
				},
			],
			yAxes: [
				{
					type: "linear",
					display: true,
					position: "left",
					id: "y-axis-1",
					gridLines: {
						display: false,
					},
				},
				{
					type: "linear",
					display: true,
					position: "right",
					id: "y-axis-2",
					gridLines: {
						display: true,
					},
				},
			],
		},
	};

	return (
		<div>
			<div
				className="tabs"
				style={{ marginLeft: "-2rem", marginTop: "-2rem" }}
			>
				<ul>
					<li
						className={classNames({
							"is-active": mode === GameMode.Normal,
						})}
					>
						<Link
							href={`/profile/[[...id]]?tab=mmrHistory&mode=Normal`}
							as={`/profile/${steamid}?tab=mmrHistory&mode=Normal`}
							passHref
						>
							<a>Standard</a>
						</Link>
					</li>
					<li
						className={classNames({
							"is-active": mode === GameMode.Turbo,
						})}
					>
						<Link
							href={`/profile/[[...id]]?tab=mmrHistory&mode=Turbo`}
							as={`/profile/${steamid}?tab=mmrHistory&mode=Turbo`}
							passHref
						>
							<a>Turbo</a>
						</Link>
					</li>
					<li
						className={classNames({
							"is-active": mode === GameMode.Duos,
						})}
					>
						<Link
							href={`/profile/[[...id]]?tab=mmrHistory&mode=Duos`}
							as={`/profile/${steamid}?tab=mmrHistory&mode=Duos`}
							passHref
						>
							<a>Duos</a>
						</Link>
					</li>
				</ul>
			</div>

			{loading && <p>Loading...</p>}

			{error && prettyError(error)}

			{!loading && !error && (
				<>
					{mmrData ? (
						<Line data={mmrData} options={options} />
					) : (
						<p>No MMR data points recorded</p>
					)}{" "}
					<hr />
				</>
			)}
		</div>
	);
};
