import { Navbar } from "../components/navbar";
import withApollo from "../lib/with-apollo";
import { NextSeo } from "next-seo";

const { NEXT_PUBLIC_URL } = process.env;

const Privacy = () => {
	return (
		<>
			<NextSeo
				title="Privacy Policy | Fortify"
				description="Fortify's Privacy Policy"
				openGraph={{
					url: `${NEXT_PUBLIC_URL}/privacy`,
					title: "Privacy Policy | Fortify",
					description: "Fortify's Privacy Policy",
				}}
			/>
			<Navbar />

			<div style={{ margin: "1rem" }}>
				<h1 className="title">Privacy Policy</h1>
			</div>
		</>
	);
};

export default withApollo(Privacy);
