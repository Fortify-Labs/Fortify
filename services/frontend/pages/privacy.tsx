import { Navbar } from "../components/navbar";
import withApollo from "../lib/with-apollo";

const Privacy = () => {
	return (
		<>
			<Navbar />
			Privacy
		</>
	);
};

export default withApollo(Privacy);
