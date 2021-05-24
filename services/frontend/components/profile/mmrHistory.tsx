import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { FunctionComponent, useEffect, useState } from "react";
import { prettyError } from "utils/error";

import {
	GameMode,
	useProfileMmrHistoryQuery,
} from "../../gql/ProfileMmrHistory.graphql";
import { ChartData, Line } from "react-chartjs-2";

import { subDays } from "date-fns";
import { DateRangePicker, RangeWithKey } from "react-date-range";
import { dateFormatter } from "../../utils/date";

export const MmrHistory: FunctionComponent<{
	steamid?: string;
}> = ({ steamid }) => {
	// --- URL query args ---
	const { query } = useRouter();
	const mode =
		GameMode[query.mode as keyof typeof GameMode] || GameMode.Normal;

	// --- UI variables ---
	const [dateRange, setDateRange] = useState<RangeWithKey[]>([
		{
			startDate: new Date(0),
			endDate: new Date(0),
			key: "selection",
		},
	]);

	useEffect(() => {
		setDateRange([
			{
				startDate: subDays(new Date(), 30),
				endDate: new Date(),
				key: "selection",
			},
		]);
	}, []);

	const [showModal, setShowModal] = useState(false);

	// --- Data fetching ---
	const { data, loading, error } = useProfileMmrHistoryQuery({
		variables: {
			steamid,
			mode,
			startDate: dateRange[0]?.startDate,
			endDate: dateRange[0]?.endDate,
		},
	});
	const { mmrHistory = [] } = data?.profile ?? {};

	// --- Data processing ---
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
				yAxisID: "y-axis-1",
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
			],
		},
	};

	return (
		<div>
			<div
				className="tabs"
				style={{ marginLeft: "-2rem", marginTop: "-1.5rem" }}
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

			{dateRange.length > 0 && (
				<div style={{ textAlign: "center", marginTop: "-1.5em" }}>
					<button
						className="button is-text"
						onClick={() => setShowModal(true)}
					>
						Charts from {dateFormatter(dateRange[0]?.startDate)} to{" "}
						{dateFormatter(dateRange[0]?.endDate)}
					</button>
				</div>
			)}

			<div
				className={classNames("modal", {
					"is-active": showModal,
				})}
			>
				<div
					className="modal-background"
					onClick={() => setShowModal(false)}
				></div>
				<div className="modal-content">
					<DateRangePicker
						onChange={(item) =>
							setDateRange([
								(item as { selection: RangeWithKey }).selection,
							])
						}
						showSelectionPreview={true}
						moveRangeOnFirstSelection={false}
						months={1}
						ranges={dateRange}
						rangeColors={["#436e9c"]}
					/>
				</div>
				<button
					className="modal-close is-large"
					aria-label="close"
					onClick={() => setShowModal(false)}
				></button>
			</div>

			{!loading &&
				!error &&
				((mmrHistory?.length ?? 0) > 0 ? (
					<Line data={mmrData} options={options} />
				) : (
					<p>No MMR data points recorded</p>
				))}
		</div>
	);
};
