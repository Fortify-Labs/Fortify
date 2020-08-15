import { Navbar } from "../components/navbar";
import withApollo from "../lib/with-apollo";

const Privacy = () => {
	return (
		<>
			<Navbar />

			<div style={{ margin: "1rem" }}>
				<h1 className="title">Privacy Policy</h1>
			</div>
		</>
	);
};

export default withApollo(Privacy);
