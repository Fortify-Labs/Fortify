import withApollo from "../lib/with-apollo";
import { Navbar } from "../components/navbar";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faOsi } from "@fortawesome/free-brands-svg-icons";
import { faStream, faHandHoldingUsd } from "@fortawesome/free-solid-svg-icons";
import { HStack } from "../components/hstack";
import { VStack } from "../components/vstack";
import classNames from "classnames";

import styles from "../css/index.module.css";

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
						<VStack
							style={{ alignItems: "center" }}
							fullWidth={true}
						>
							<FontAwesomeIcon
								icon={faOsi}
								size="5x"
								style={{ marginRight: "16px" }}
							/>
							<HStack>
								<h1
									className="title is-2"
									style={{ marginBottom: "4px" }}
								>
									Open Source
								</h1>
								<p className="is-size-6">
									Lorem ipsum dolor sit amet, consectetur
									adipiscing elit. Maecenas nulla nisl,
									aliquet nec efficitur vitae, iaculis
									placerat lorem. Integer tempus lorem quis
									metus tincidunt bibendum. Maecenas eget urna
									sem. Sed efficitur, ex vitae fringilla
									vestibulum, nisi nisl eleifend est, sed
									pharetra ipsum ante eu dolor. Nullam
									imperdiet sit amet orci imperdiet sodales.
									Proin sed magna non odio ullamcorper
									consequat non sed sem. Etiam eget erat
									lectus. Vestibulum placerat eros dictum quam
									aliquam lacinia. Vestibulum fringilla leo eu
									justo accumsan hendrerit. Sed semper iaculis
									purus sit amet tincidunt.
								</p>
							</HStack>
						</VStack>
					</div>
				</div>
				<div className={classNames("columns", styles.columns)}>
					<div className="column is-half is-offset-one-quarter">
						<VStack
							style={{ alignItems: "center" }}
							fullWidth={true}
						>
							<FontAwesomeIcon
								icon={faStream}
								size="5x"
								style={{ marginRight: "16px" }}
							/>
							<HStack>
								<h1
									className="title is-2"
									style={{ marginBottom: "4px" }}
								>
									Real Time Data Processing
								</h1>
								Lorem ipsum dolor sit amet, consectetur
								adipiscing elit. Maecenas nulla nisl, aliquet
								nec efficitur vitae, iaculis placerat lorem.
								Integer tempus lorem quis metus tincidunt
								bibendum. Maecenas eget urna sem. Sed efficitur,
								ex vitae fringilla vestibulum, nisi nisl
								eleifend est, sed pharetra ipsum ante eu dolor.
								Nullam imperdiet sit amet orci imperdiet
								sodales. Proin sed magna non odio ullamcorper
								consequat non sed sem. Etiam eget erat lectus.
								Vestibulum placerat eros dictum quam aliquam
								lacinia. Vestibulum fringilla leo eu justo
								accumsan hendrerit. Sed semper iaculis purus sit
								amet tincidunt.
							</HStack>
						</VStack>
					</div>
				</div>
				<div
					className={classNames("columns", styles.columns)}
					style={{ marginBottom: "4px" }}
				>
					<div className="column is-half is-offset-one-quarter">
						<VStack
							style={{ alignItems: "center" }}
							fullWidth={true}
						>
							<FontAwesomeIcon
								icon={faHandHoldingUsd}
								size="5x"
								style={{ marginRight: "16px" }}
							/>
							<HStack>
								<h1
									className="title is-2"
									style={{ marginBottom: "4px" }}
								>
									Free Of Charge
								</h1>
								Lorem ipsum dolor sit amet, consectetur
								adipiscing elit. Maecenas nulla nisl, aliquet
								nec efficitur vitae, iaculis placerat lorem.
								Integer tempus lorem quis metus tincidunt
								bibendum. Maecenas eget urna sem. Sed efficitur,
								ex vitae fringilla vestibulum, nisi nisl
								eleifend est, sed pharetra ipsum ante eu dolor.
								Nullam imperdiet sit amet orci imperdiet
								sodales. Proin sed magna non odio ullamcorper
								consequat non sed sem. Etiam eget erat lectus.
								Vestibulum placerat eros dictum quam aliquam
								lacinia. Vestibulum fringilla leo eu justo
								accumsan hendrerit. Sed semper iaculis purus sit
								amet tincidunt.
							</HStack>
						</VStack>
					</div>
				</div>
			</div>
		</>
	);
};

export default withApollo(Index);
