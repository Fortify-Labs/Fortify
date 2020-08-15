import type { AppProps } from "next/app";

import { Footer } from "../components/footer";
import CookieConsent from "react-cookie-consent";

import "../sass/mystyles.scss";
import styles from "../css/_appStyles.module.css";

function MyApp({ Component, pageProps }: AppProps) {
	return (
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
	);
}

export default MyApp;
