import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { FunctionComponent } from "react";

import {
	GameMode,
	useProfileMmrHistoryQuery,
} from "../../gql/ProfileMmrHistory.graphql";
import { LineChart } from "../linechart";

export const MmrHistory: FunctionComponent<{
	steamid?: string;
}> = ({ steamid }) => {
	const { query } = useRouter();
	const mode =
		GameMode[query.mode as keyof typeof GameMode] || GameMode.Standard;

	const { data, loading, error } = useProfileMmrHistoryQuery({
		variables: {
			steamid,
			mode,
		},
	});
	const { mmrHistory } = data?.profile ?? {};

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
			<div
				className="tabs"
				style={{ marginLeft: "-2rem", marginTop: "-2rem" }}
			>
				<ul>
					<li
						className={classNames({
							"is-active": mode === GameMode.Standard,
						})}
					>
						<Link
							href={`/profile/[[...id]]?tab=mmrHistory&mode=Standard`}
							as={`/profile/${steamid}?tab=mmrHistory&mode=Standard`}
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

			{error && (
				<p>
					{error.name} - {error.message}
				</p>
			)}

			{!loading && !error && (
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
