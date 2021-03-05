import { FunctionComponent, useState } from "react";
import { dateFormatter } from "utils/date";
import { prettyError } from "utils/error";
import {
	ProfileMatchQuery,
	useProfileMatchQuery,
} from "../../gql/ProfileMatch.graphql";
import Link from "next/link";
import classNames from "classnames";
import { ApolloQueryResult } from "@apollo/client";

export const RecentMatchesTable: FunctionComponent<{
	steamid?: string;
}> = ({ steamid }) => {
	// TODO: Get current page from URL

	// --- Hooks ---
	// const [limit, setLimit] = useState(50);
	const limit = 50;
	const [offset, setOffset] = useState(0);

	// --- Data fetching ---
	const initialQueryResult = useProfileMatchQuery({
		variables: { steamid, limit, offset: 0 },
		errorPolicy: "all",
	});
	const { fetchMore } = initialQueryResult;
	const [{ data, loading, error, networkStatus }, setQueryResult] = useState<
		ApolloQueryResult<ProfileMatchQuery | undefined>
	>(initialQueryResult);

	const loadOffset = async (newOffset: number) => {
		setOffset(newOffset);
		setQueryResult({
			loading: true,
			data: {
				profile: {
					steamid: data?.profile?.steamid ?? "",
					matches: {
						total: data?.profile?.matches?.total ?? 0,
					},
				},
			},
			networkStatus,
		});
		const result = await fetchMore({
			variables: {
				steamid,
				limit,
				offset: newOffset,
			},
		});
		setQueryResult(result);
	};

	const { profile } = data ?? {};
	const { matches } = profile ?? {};

	// --- UI variables ---
	const currentPage = Math.ceil((limit + (offset ?? 0)) / limit);
	const totalPages = Math.ceil((matches?.total ?? 0) / limit);

	return (
		<>
			{error && prettyError(error)}

			{loading && (
				<div className="loader-wrapper is-active">
					<div className="loader is-loading"></div>
				</div>
			)}

			{!loading && !error && matches != null && (
				<table className="table is-fullwidth is-hoverable">
					<thead>
						<tr>
							<th>Placement</th>
							<th>Duration</th>
							<th>Average MMR</th>
							<th>Date</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{matches.slots?.map((match) => {
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
									<td>
										{match && match.match && (
											<Link
												href="/match/[[...id]]"
												as={`/match/${
													match.match?.id ?? 0
												}`}
												passHref
											>
												<a>View Match</a>
											</Link>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}

			<br />

			<nav
				className="pagination"
				role="navigation"
				aria-label="pagination"
			>
				<a
					className="pagination-previous"
					onClick={async () => {
						if (currentPage > 1) {
							await loadOffset(offset - limit);
						}
					}}
				>
					Previous
				</a>
				<a
					className="pagination-next"
					onClick={async () => {
						if (currentPage < totalPages) {
							await loadOffset(offset + limit);
						}
					}}
				>
					Next page
				</a>
				<ul className="pagination-list">
					<li>
						<a
							className={classNames("pagination-link", {
								"is-current": currentPage == 1,
							})}
							aria-label="Goto page 1"
							onClick={async () => await loadOffset(0)}
						>
							1
						</a>
					</li>
					{
						// Only show pagination ellipsis if currentPage is above 3
					}
					{currentPage > 3 && (
						<li>
							<span className="pagination-ellipsis">
								&hellip;
							</span>
						</li>
					)}
					{currentPage - 1 > 1 && (
						<li>
							<a
								className="pagination-link"
								aria-label={`Goto page ${currentPage - 1}`}
								onClick={async () =>
									await loadOffset((currentPage - 2) * limit)
								}
							>
								{currentPage - 1}
							</a>
						</li>
					)}
					{currentPage > 1 && currentPage < totalPages && (
						<li>
							<a
								className="pagination-link is-current"
								aria-label={`Page ${currentPage}`}
								aria-current="page"
							>
								{currentPage}
							</a>
						</li>
					)}
					{currentPage + 1 < totalPages && (
						<li>
							<a
								className="pagination-link"
								aria-label={`Goto page ${currentPage + 1}`}
								onClick={async () =>
									await loadOffset(currentPage * limit)
								}
							>
								{currentPage + 1}
							</a>
						</li>
					)}
					{currentPage + 1 < totalPages && (
						<li>
							<span className="pagination-ellipsis">
								&hellip;
							</span>
						</li>
					)}
					{totalPages > 1 && (
						<li>
							<a
								className={classNames("pagination-link", {
									"is-current": currentPage == totalPages,
								})}
								aria-label={`Goto page ${totalPages}`}
								onClick={async () =>
									await loadOffset((totalPages - 1) * limit)
								}
							>
								{totalPages}
							</a>
						</li>
					)}
				</ul>
			</nav>
		</>
	);
};
