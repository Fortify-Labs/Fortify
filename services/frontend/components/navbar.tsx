import React, { useState } from "react";
import classNames from "classnames";

import Image from "next/image";

import Link from "next/link";
import { useRouter } from "next/router";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons";

import { removeCookie } from "../utils/cookie";

import packageJSON from "../package.json";

import { useAuthenticatedQuery } from "../gql/Authenticated.graphql";
import { useVersionQuery } from "../gql/Version.graphql";
import { useMyMatchQuery } from "gql/MyMatch.graphql";
import { useMyMatchSubscription } from "gql/MyMatchSubscription.graphql";
import { GSIModal } from "./gsiModal";

export const Navbar = () => {
	const [isActive, setIsActive] = useState(false);
	const [gsiModalVisible, setGsiModalVisible] = useState(false);

	const { data } = useAuthenticatedQuery();
	const { authenticated, user } = data?.authenticated ?? {};

	const { data: versionData } = useVersionQuery();

	const { data: myMatchDate } = useMyMatchQuery({ errorPolicy: "ignore" });
	const { data: myMatchID } = useMyMatchSubscription();

	return (
		<>
			<nav
				className="navbar"
				role="navigation"
				aria-label="main navigation"
			>
				<div className="navbar-brand">
					<Link href="/" passHref={true}>
						<a className="navbar-item">
							<Image
								src="/images/Fortify_WIP.png"
								width="100"
								height="45"
							/>
						</a>
					</Link>

					<a
						role="button"
						className={classNames("navbar-burger", "burger", {
							"is-active": isActive,
						})}
						aria-label="menu"
						aria-expanded="false"
						data-target="navbarBasicExample"
						onClick={() => setIsActive(!isActive)}
					>
						<span aria-hidden="true"></span>
						<span aria-hidden="true"></span>
						<span aria-hidden="true"></span>
					</a>
				</div>

				<div
					id="navbarBasicExample"
					className={classNames("navbar-menu", {
						"is-active": isActive,
					})}
				>
					<div className="navbar-start">
						<NavbarLink href="/matches" value="Matches" />
						{authenticated &&
							(myMatchID?.currentMatchID ||
								myMatchDate?.currentMatch?.id) && (
								<NavbarLink
									href="/match/[[...id]]"
									as={`/match/${encodeURIComponent(
										myMatchID?.currentMatchID ||
											myMatchDate?.currentMatch?.id ||
											""
									)}`}
									value="My Lobby"
								/>
							)}
						<NavbarLink
							href="/leaderboard/[[...leaderboard]]"
							as="/leaderboard/standard"
							value="Leaderboard"
						/>
					</div>

					<div className="navbar-end">
						{authenticated && (
							<>
								<button
									className="button navbar-item is-outlined"
									style={{
										margin: "auto",
										background: "transparent",
										color: "white",
										borderColor: "white",
									}}
									onClick={() => setGsiModalVisible(true)}
								>
									Setup GSI
								</button>
								<NavbarLink
									href="/profile/[[...id]]"
									as={`/profile/${user?.steamid ?? 0}`}
									value="My Profile"
								/>
							</>
						)}
						{!authenticated && (
							<div className="navbar-item">
								<div className="buttons">
									<a
										className="button is-primary is-inverted"
										href={process.env.NEXT_PUBLIC_LOGIN_URL}
									>
										Log in
									</a>
								</div>
							</div>
						)}
						{authenticated && (
							<div className="navbar-item has-dropdown is-hoverable">
								<a className="navbar-link">
									<span className="icon has-text-info">
										<FontAwesomeIcon
											icon={faCog}
											color="white"
										/>
									</span>
								</a>

								<div className="navbar-dropdown is-right">
									<a
										className="navbar-item"
										target="_blank"
										href="https://github.com/Fortify-Labs/Fortify/issues"
									>
										Report a bug
									</a>
									<a
										className="navbar-item"
										target="_blank"
										href="https://discord.gg/M2rD7fD"
									>
										Need help?
									</a>
									<a
										className="navbar-item"
										onClick={() => {
											removeCookie("auth");
											document.location.href = "/";
										}}
									>
										Logout
									</a>
									<hr className="navbar-divider" />
									<div className="navbar-item">
										Frontend Version {packageJSON.version}
									</div>
									<div className="navbar-item">
										Backend Version {versionData?.version}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</nav>

			<GSIModal
				visible={gsiModalVisible}
				setVisible={setGsiModalVisible}
			/>
		</>
	);
};

const NavbarLink = ({
	href,
	value,
	as,
}: {
	href: string;
	value: string;
	as?: string;
}) => {
	const router = useRouter();
	const route = href.replace("/", "");

	return (
		<Link href={href} passHref={true} as={as}>
			<a
				className={classNames("navbar-item", {
					"is-active": router.route == route,
				})}
			>
				{value}
			</a>
		</Link>
	);
};
