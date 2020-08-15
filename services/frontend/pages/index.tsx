import withApollo from "../lib/with-apollo";
import { Navbar } from "../components/navbar";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faOsi } from "@fortawesome/free-brands-svg-icons";
import { faStream, faHandHoldingUsd } from "@fortawesome/free-solid-svg-icons";
import { VStack } from "../components/vstack";
import classNames from "classnames";

import styles from "../css/index.module.css";
import { HStack } from "../components/hstack";

const Index = () => {
	return (
		<>
			<Navbar />

			<div
				style={{
					backgroundImage:
						"linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) ), url(/images/flattened-bg.png)",
					backgroundSize: "100%",
					backgroundRepeat: "no-repeat",
					flex: 1,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div className={classNames("columns", styles.columns)}>
					<div className="column has-text-centered">
						<h1 className="title is-1">Fortify</h1>
						<h1 className="subtitle" style={{ color: "white" }}>
							Open Source Dota Underlords Data Platform
						</h1>
					</div>
				</div>
				<div className={classNames("columns", styles.columns)}>
					<div className="column is-half is-offset-one-quarter">
						<HStack
							style={{ alignItems: "center" }}
							fullWidth={true}
						>
							<FontAwesomeIcon
								icon={faOsi}
								size="5x"
								style={{ marginRight: "16px" }}
							/>
							<VStack>
								<h1
									className="title is-2"
									style={{ marginBottom: "4px" }}
								>
									Open Source
								</h1>
								<p className="is-size-6">
									Fortify is completely open source and is
									signed under the AGPL license, as the
									project is being developed by and for the
									community. This means all of the code is
									openly available for anyone to use, modify
									and redistribute. This also means that
									everyone is welcome to contribute and help
									in the development of the project, as we
									move towards the common goal of providing
									useful tools for the community. Whether you
									are a skilled developer looking to
									contribute by fixing bugs or helping with
									new features, or a person with a feature
									request, feel free to reach out and
									contribute.
								</p>
							</VStack>
						</HStack>
					</div>
				</div>
				<div className={classNames("columns", styles.columns)}>
					<div className="column is-half is-offset-one-quarter">
						<HStack
							style={{ alignItems: "center" }}
							fullWidth={true}
						>
							<FontAwesomeIcon
								icon={faStream}
								size="5x"
								style={{ marginRight: "16px" }}
							/>
							<VStack>
								<h1
									className="title is-2"
									style={{ marginBottom: "4px" }}
								>
									Real Time Data Processing
								</h1>
								All of your data from the game is processed in
								real time - while you are in a match, or
								spectating a friend's game. The game broadcasts
								the details pertaining to the match like the
								units on the board, names and ranks of your
								opponents and a lot of other lobby related
								information. This data is sent to our servers,
								which is processed immediately and displayed to
								you with relevant metrics that will help enhance
								your gameplay experience. Be it knowing the
								chances of finding that 3* unit you are rolling
								for, or the strength of your lobby in terms of
								their ranks and MMR, Fortify has you covered.
							</VStack>
						</HStack>
					</div>
				</div>
				<div
					className={classNames("columns", styles.columns)}
					style={{ marginBottom: "4px" }}
				>
					<div className="column is-half is-offset-one-quarter">
						<HStack
							style={{ alignItems: "center" }}
							fullWidth={true}
						>
							<FontAwesomeIcon
								icon={faHandHoldingUsd}
								size="5x"
								style={{ marginRight: "16px" }}
							/>
							<VStack>
								<h1
									className="title is-2"
									style={{ marginBottom: "4px" }}
								>
									Free Of Charge
								</h1>
								And here's the icing on the cake, it's
								completely free of charge! This follows from the
								fact that the plaform is being developed by the
								community, for the benefit of the community.
								Locking it behind a paywall defeats the purpose
								of doing something for the community, so the
								project is entirely free for just about anyone
								who plays Underlords. All you have to do is
								signup, follow the instructions to set it up and
								you're good to go! No hidden charges, and no
								features locked behind a paywall. Experience all
								the features we have to offer, and witness the
								power of what Fortify can do to improve your
								gameplay experience.
							</VStack>
						</HStack>
					</div>
				</div>
			</div>
		</>
	);
};

export default withApollo(Index);
