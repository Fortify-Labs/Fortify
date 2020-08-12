import type { AppProps } from "next/app";

import { Footer } from "../components/footer";

import "../sass/mystyles.scss";
import styles from "../css/_appStyles.module.css";

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<div className={styles.Site}>
			<div className={styles.SiteContent}>
				<Component {...pageProps} />
			</div>
			<Footer />
		</div>
	);
}

export default MyApp;
