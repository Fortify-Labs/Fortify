import Link from "next/link";
import { useRouter } from "next/router";
import classNames from "classnames";

import withApollo from "../../lib/with-apollo";

import { LobbySummary } from "../../components/lobby/summary";
import { PoolViewer } from "../../components/lobby/pool";
import { Navbar } from "../../components/navbar";
import { useLobbySubscription } from "../../gql/LobbySubscription.graphql";

const Lobby = () => {
	const router = useRouter();
	const { id: queryID, tab: queryTab } = router.query;
	const id = queryID?.toString();

	useLobbySubscription({ variables: { id } });

	const tabContents = {
		lobby: <LobbySummary />,
		pool: <PoolViewer />,
	};
	const tab = Object.keys(tabContents).includes(queryTab?.toString() ?? "")
		? (queryTab?.toString() as keyof typeof tabContents)
		: "lobby";

	return (
		<>
			<Navbar />
			<div style={{ margin: "1rem" }}>
				<div className="tabs">
					<ul>
						<li
							className={classNames({
								"is-active": tab == "lobby",
							})}
						>
							<Link
								href={{ query: { tab: "lobby" } }}
								as={{
									pathname: `/lobby${id ? `/${id}` : ""}`,
									query: { tab: "lobby" },
								}}
								passHref
							>
								<a>Lobby Summary</a>
							</Link>
						</li>
						<li
							className={classNames({
								"is-active": tab == "pool",
							})}
						>
							<Link
								href={{ query: { tab: "pool" } }}
								as={{
									pathname: `/lobby${id ? `/${id}` : ""}`,
									query: { tab: "pool" },
								}}
								passHref
							>
								<a>Pool Viewer</a>
							</Link>
						</li>
						<li>
							<a style={{ textDecoration: "line-through" }}>
								Odds Calculator
							</a>
						</li>
						<li>
							<a style={{ textDecoration: "line-through" }}>
								VS Boards
							</a>
						</li>
					</ul>
				</div>

				<div style={{ marginTop: "1rem" }}>{tabContents[tab]}</div>
			</div>
		</>
	);
};

export default withApollo(Lobby);
