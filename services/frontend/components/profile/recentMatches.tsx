import { FunctionComponent, useState } from "react";
import { dateFormatter } from "utils/date";
import { prettyError } from "utils/error";
import { useProfileMatchQuery } from "../../gql/ProfileMatch.graphql";
import Link from "next/link";
import classNames from "classnames";

export const RecentMatchesTable: FunctionComponent<{
	steamid?: string;
}> = ({ steamid }) => {
	// TODO: Get current page from URL

	// --- Hooks ---
	// const [limit, setLimit] = useState(50);
	const limit = 50;
	const [offset, setOffset] = useState(0);

	// --- Data fetching ---
	const { data, loading, error } = useProfileMatchQuery({
		variables: { steamid, limit, offset },
		errorPolicy: "all",
	});
	const { profile } = data ?? {};
	const { matches } = profile ?? {};

	// --- UI variables ---
	const currentPage = Math.ceil(
		((matches?.limit ?? 0) + (matches?.offset ?? 0)) / limit
	);
	const totalPages = Math.ceil((matches?.total ?? 0) / limit);

	return (
		<>
			{loading && <p>Loading...</p>}
			{error && prettyError(error)}

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
					{!loading &&
						!error &&
						matches?.slots?.map((match) => {
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

			<p>
				Page{" "}
				<b>
					{currentPage} of {totalPages}
				</b>
			</p>

			<nav
				className="pagination"
				role="navigation"
				aria-label="pagination"
			>
				<a
					className="pagination-previous"
					onClick={() => {
						if (currentPage > 1) {
							setOffset(offset - limit);
						}
					}}
				>
					Previous
				</a>
				<a
					className="pagination-next"
					onClick={() => {
						if (currentPage < totalPages) {
							setOffset(offset + limit);
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
						>
							1
						</a>
					</li>
					{
						// Only show pagination ellipsis if currentPage is above 2
					}
					{currentPage > 2 && (
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
