import { FunctionComponent } from "react";
import { dateFormatter } from "utils/date";
import { prettyError } from "utils/error";
import { useProfileMatchQuery } from "../../gql/ProfileMatch.graphql";
import Link from "next/link";
import classNames from "classnames";
import { useRouter } from "next/router";
import { LoadingSpinner } from "components/loader";

export const RecentMatchesTable: FunctionComponent<{
	steamid?: string;
	limit?: number;
	showPagination?: boolean;
	appendViewMoreRow?: {
		steamID: string;
	};
}> = ({ steamid, limit = 50, showPagination = true, appendViewMoreRow }) => {
	const router = useRouter();
	const { page, id: queryID } = router.query;
	const id = queryID?.toString();
	const pageString = page?.toString();

	// --- Hooks ---
	let offset = 0;
	let currentPage = 1;
	try {
		const parsedPage = parseInt(pageString);

		if (!isNaN(parsedPage) && parsedPage > 0) {
			currentPage = parsedPage;
			offset = (currentPage - 1) * limit;
		}
	} catch (e) {}

	// --- Data fetching ---
	const { data, loading, error, previousData } = useProfileMatchQuery({
		variables: { steamid, limit, offset },
		errorPolicy: "all",
	});

	const { profile } = data ?? previousData ?? {};
	const { matches } = profile ?? {};

	// --- UI variables ---
	const totalPages = Math.ceil((matches?.total ?? 0) / limit);

	return (
		<>
			{error && prettyError(error)}

			{loading && <LoadingSpinner />}

			{!loading && !error && matches != null && (
				<table
					className="table is-fullwidth is-hoverable"
					style={{
						width: "100%",
						height: "100%",
						overflowY: "scroll",
						overflowX: "scroll",
					}}
				>
					<thead>
						<tr>
							<th>Placement</th>
							<th>Average MMR</th>
							<th>Duration</th>
							<th>Game Mode</th>
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
									<td>{match?.match?.averageMMR}</td>
									<td>
										{!isNaN(duration) &&
											new Date(duration)
												.toISOString()
												.substr(11, 8)}{" "}
										min
									</td>
									<td>
										{match?.match?.mode?.toString() ??
											"No game mode"}
									</td>
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
						{appendViewMoreRow && (
							<tr>
								<td colSpan={6}>
									<Link
										href={{
											pathname: "/profile/[[...id]]",
											query: {
												id: appendViewMoreRow.steamID,
											},
										}}
									>
										<a>View More</a>
									</Link>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			)}

			<br />

			{showPagination && (
				<nav
					className="pagination"
					role="navigation"
					aria-label="pagination"
				>
					<Link
						href={{
							pathname: "/profile/[[...id]]",
							query: {
								id,
								tab: "matches",
								page:
									currentPage - 1 >= 1 ? currentPage - 1 : 1,
							},
						}}
						passHref
					>
						<a className="pagination-previous">Previous</a>
					</Link>
					<Link
						href={{
							pathname: "/profile/[[...id]]",
							query: {
								id,
								tab: "matches",
								page:
									currentPage + 1 <= totalPages
										? currentPage + 1
										: totalPages,
							},
						}}
						passHref
					>
						<a className="pagination-next">Next page</a>
					</Link>
					<ul className="pagination-list">
						<li>
							<Link
								href={{
									pathname: "/profile/[[...id]]",
									query: {
										id,
										tab: "matches",
										page: 1,
									},
								}}
								passHref
							>
								<a
									className={classNames("pagination-link", {
										"is-current": currentPage == 1,
									})}
									aria-label="Goto page 1"
								>
									1
								</a>
							</Link>
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
								<Link
									href={{
										pathname: "/profile/[[...id]]",
										query: {
											id,
											tab: "matches",
											page: currentPage - 1,
										},
									}}
									passHref
								>
									<a
										className="pagination-link"
										aria-label={`Goto page ${
											currentPage - 1
										}`}
									>
										{currentPage - 1}
									</a>
								</Link>
							</li>
						)}
						{currentPage > 1 && currentPage < totalPages && (
							<li>
								<Link
									href={{
										pathname: "/profile/[[...id]]",
										query: {
											id,
											tab: "matches",
											page: currentPage,
										},
									}}
									passHref
								>
									<a
										className="pagination-link is-current"
										aria-label={`Page ${currentPage}`}
										aria-current="page"
									>
										{currentPage}
									</a>
								</Link>
							</li>
						)}
						{currentPage + 1 < totalPages && (
							<li>
								<Link
									href={{
										pathname: "/profile/[[...id]]",
										query: {
											id,
											tab: "matches",
											page: currentPage + 1,
										},
									}}
									passHref
								>
									<a
										className="pagination-link"
										aria-label={`Goto page ${
											currentPage + 1
										}`}
									>
										{currentPage + 1}
									</a>
								</Link>
							</li>
						)}
						{currentPage + 2 < totalPages && (
							<li>
								<span className="pagination-ellipsis">
									&hellip;
								</span>
							</li>
						)}
						{totalPages > 1 && (
							<li>
								<Link
									href={{
										pathname: "/profile/[[...id]]",
										query: {
											id,
											tab: "matches",
											page: totalPages,
										},
									}}
									passHref
								>
									<a
										className={classNames(
											"pagination-link",
											{
												"is-current":
													currentPage == totalPages,
											}
										)}
										aria-label={`Goto page ${totalPages}`}
									>
										{totalPages}
									</a>
								</Link>
							</li>
						)}
					</ul>
				</nav>
			)}
		</>
	);
};
