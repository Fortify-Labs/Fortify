import type { AppProps } from "next/app";

import { DefaultSeo } from "next-seo";
import defaultSEOConfigs from "../next-seo.config";

import { Footer } from "../components/footer";
import CookieConsent from "react-cookie-consent";

// import * as Sentry from "@sentry/react";
// import { Integrations } from "@sentry/tracing";

import "../sass/mystyles.scss";
import styles from "../css/_appStyles.module.css";

// import { Context } from "@shared/auth";

// import packageJSON from "../package.json";
// import { getCookie } from "utils/cookie";

function MyApp({ Component, pageProps }: AppProps) {
	// Sentry.init({
	// 	dsn:
	// 		"https://55dabff87d3d4ab087fd8c0ad574f5e2@o441681.ingest.sentry.io/5413254",
	// 	integrations: [new Integrations.BrowserTracing()],
	// 	tracesSampleRate: 1.0,
	// 	release: "frontend@" + packageJSON.version,
	// });
	// Sentry.configureScope((scope) => {
	// 	const jwt = getCookie("auth", null);

	// 	if (jwt) {
	// 		const user: Context = JSON.parse(atob(jwt.split(".")[1]));

	// 		scope.setUser({
	// 			id: user.user.id,
	// 		});
	// 	}
	// });

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
