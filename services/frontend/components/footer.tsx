import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord, faGithub } from "@fortawesome/free-brands-svg-icons";

export const Footer = () => {
	return (
		<footer className="footer">
			<div className="content is-pulled-left">
				<p>
					<strong>℗ Fortify Project, 2020</strong> <br />
					Dota, Dota Underlords and Steam are registered trademarks of
					Valve Corporation. <br />
					<a
						href="https://discord.gg/u9qJxzQ"
						target="_blank"
						style={{ color: "white" }}
					>
						<FontAwesomeIcon icon={faDiscord} size="2x" />
					</a>{" "}
					<a
						href="https://github.com/Fortify-Labs/Fortify"
						target="_blank"
						style={{ color: "white" }}
					>
						<FontAwesomeIcon icon={faGithub} size="2x" />
					</a>{" "}
				</p>
			</div>
			<div className="content is-pulled-right">
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
