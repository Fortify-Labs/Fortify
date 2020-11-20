import type { AppProps } from "next/app";

import { DefaultSeo } from "next-seo";
import defaultSEOConfigs from "../next-seo.config";

import { Footer } from "../components/footer";
import CookieConsent from "react-cookie-consent";

import "../sass/mystyles.scss";
import styles from "../css/_appStyles.module.css";

import { Context } from "@shared/definitions/context";

import packageJSON from "../package.json";
import { getCookie } from "utils/cookie";

import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";
import getConfig from "next/config";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
	const config = getConfig();
	const distDir = `${config.serverRuntimeConfig.rootDir}/.next`;
	Sentry.init({
		enabled: process.env.NODE_ENV === "production",
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
		integrations: [
			new RewriteFrames({
				iteratee: (frame) => {
					frame.filename = frame.filename?.replace(
						distDir,
						"app:///_next"
					);
					return frame;
				},
			}),
		],
		tracesSampleRate: 1.0,
		release: "frontend@" + packageJSON.version,
	});

	Sentry.configureScope((scope) => {
		const jwt = getCookie("auth", null);

		if (jwt) {
			const user: Context = JSON.parse(atob(jwt.split(".")[1]));

			scope.setUser({
				id: user.user.id,
			});
		}
	});
}

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<DefaultSeo {...defaultSEOConfigs} />

			<div className={styles.Site}>
				<div className={styles.SiteContent}>
					<Component {...pageProps} />
				</div>
				<Footer />

				<CookieConsent
					location="bottom"
					enableDeclineButton
					sameSite="strict"
					overlay={true}
					setDeclineCookie={false}
					onDecline={() =>
						(document.location.href = "https://google.com")
					}
				>
					This website uses cookies to enhance the user experience.
				</CookieConsent>
			</div>
		</>
	);
}

export default MyApp;
