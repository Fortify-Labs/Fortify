import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";

export const Footer = () => {
	return (
		<footer className="footer">
			<div className="content is-pulled-left">
				<p>
					<strong>℗ Fortify Project, 2021</strong> <br />
					Dota, Dota Underlords and Steam are registered trademarks of
					Valve Corporation. <br />
					<a
						href="https://discord.gg/u9qJxzQ"
						target="_blank"
						rel="noopener noreferrer"
						style={{ color: "white" }}
					>
						<FontAwesomeIcon
							icon={faDiscord}
							width="2em"
							height="2em"
							size="2x"
						/>
					</a>{" "}
					<a
						href="https://github.com/Fortify-Labs/Fortify"
						target="_blank"
						rel="noopener noreferrer"
						style={{
							color: "white",
							marginLeft: "0.5em",
							marginTop: "0.5em",
						}}
					>
						<FontAwesomeIcon
							icon={faGithub}
							width="2em"
							height="2em"
							size="2x"
						/>
					</a>{" "}
				</p>
			</div>
			<div className="content is-pulled-right">
				<a href="https://status.fortify.gg" target="_blank">
					Status
				</a>{" "}
				|{" "}
				<Link href="/privacy" passHref>
					<a>Privacy Policy</a>
				</Link>{" "}
				|{" "}
				<Link href="/imprint" passHref>
					<a>Imprint</a>
				</Link>
			</div>
		</footer>
	);
};
