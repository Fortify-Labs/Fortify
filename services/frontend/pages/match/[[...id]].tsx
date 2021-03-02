import classNames from "classnames";
import { BoardViewer } from "components/match/board";
import { MatchSummary } from "components/match/match";
import { Navbar } from "components/navbar";
import { useMatchQuery } from "gql/Match.graphql";
import { useMatchSubscription } from "gql/MatchSubscription.graphql";
import withApollo from "lib/with-apollo";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { prettyError } from "utils/error";
import { PoolViewer } from "components/match/pool";
import { OddsCalculator } from "components/match/odds";
import { dateFormatter } from "utils/date";

const Match = () => {
	const router = useRouter();
	const { id: queryID, tab: queryTab } = router.query;
	const id =
		typeof queryID == "object" ? queryID.join("/") : queryID?.toString();

	// If no match id has been passed return a generic error
	if (!id) {
		return (
			<>
				<NextSeo
					title="Missing Match ID | Fortify"
					openGraph={{
						url: `${process.env.NEXT_PUBLIC_URL}/match`,
						title: "Missing Match ID | Fortify",
					}}
				/>

				<Navbar />

				<div style={{ margin: "1rem" }}>Match ID missing</div>
			</>
		);
	}

	// --- Data fetching ---

	// - Initially fetch the data -
	const { data, error, loading } = useMatchQuery({
		variables: { id },
		errorPolicy: "all",
	});
	// - Subscribe to match data updates -
	// As the subscription is going to pipe data identified with the match ID
	// apollo will be able to automatically take care of updating the data
	// of the initial query, which then in turn will trigger re-renders if necessary
	const { error: wsError } = useMatchSubscription({
		variables: { id },
		shouldResubscribe: true,
	});

	// --- Tabs ---

	const tabContents = {
		match: <MatchSummary id={id} />,
		pool: <PoolViewer id={id} />,
		odds: <OddsCalculator id={id} />,
		boards: <BoardViewer id={id} />,
	};

	const tab: keyof typeof tabContents = Object.keys(tabContents).includes(
		queryTab?.toString() ?? ""
	)
		? (queryTab?.toString() as keyof typeof tabContents)
		: "match";

	// --- Local variables ---

	const duration = data?.match?.ended
		? data?.match?.ended - data.match.created
		: data?.match?.updated - data?.match?.created;

	// --- View ---

	return (
		<>
			<NextSeo
				title="Match | Fortify"
				openGraph={{
					url: `${process.env.NEXT_PUBLIC_URL}/match/${id}`,
					title: "Match | Fortify",
				}}
			/>

			<Navbar />

			<div style={{ margin: "1rem" }}>
				{loading && <p>Loading...</p>}
				{error && prettyError(error)}
				{data && (
					<>
						{
							// Match information
						}
						<div className="columns">
							<div className="column">
								Game Mode: {data?.match?.mode}
							</div>{" "}
							<div className="column">
								Average MMR: {data?.match?.averageMMR}
							</div>
							<div className="column">
								Started: {dateFormatter(data?.match?.created)}
							</div>
							<div className="column">
								Last updated:{" "}
								{dateFormatter(data?.match?.updated)}
							</div>
							{data?.match?.ended && (
								<div className="column">
									Ended: {dateFormatter(data?.match?.ended)}
								</div>
							)}
							<div className="column">
								Duration:{" "}
								{!isNaN(duration) &&
									new Date(duration)
										.toISOString()
										.substr(11, 8)}{" "}
								min
							</div>
						</div>{" "}
						{
							// Subscription error handling
						}
						{wsError && (
							<div className="columns">
								<div className="column">
									{prettyError(
										wsError,
										"An error occured while connecting to the realtime websocket endpoint"
									)}
								</div>
							</div>
						)}
						{
							// Tab selection
						}
						<div className="tabs">
							<ul>
								<li
									className={classNames({
										"is-active": tab == "match",
									})}
								>
									<Link
										href={{ query: { id, tab: "match" } }}
										as={{
											pathname: `/match/${id}`,
											query: { tab: "match" },
										}}
										passHref
									>
										<a>Match Summary</a>
									</Link>
								</li>
								<li
									className={classNames({
										"is-active": tab == "pool",
									})}
								>
									<Link
										href={{ query: { id, tab: "pool" } }}
										as={{
											pathname: `/match/${id}`,
											query: { tab: "pool" },
										}}
										passHref
									>
										<a>Pool Viewer</a>
									</Link>
								</li>
								<li
									className={classNames({
										"is-active": tab == "odds",
									})}
								>
									<Link
										href={{ query: { id, tab: "odds" } }}
										as={{
											pathname: `/match/${id}`,
											query: { tab: "odds" },
										}}
										passHref
									>
										<a>Odds Calculator</a>
									</Link>
								</li>
								<li
									className={classNames({
										"is-active": tab == "boards",
									})}
								>
									<Link
										href={{ query: { id, tab: "boards" } }}
										as={{
											pathname: `/match/${id}`,
											query: { tab: "boards" },
										}}
										passHref
									>
										<a>Boards</a>
									</Link>
								</li>
							</ul>
						</div>
						{
							// Tab content
						}
						{tabContents[tab]}
					</>
				)}
			</div>
		</>
	);
};

export default withApollo(Match);
