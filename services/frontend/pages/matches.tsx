import withApollo from "../lib/with-apollo";
import { Navbar } from "../components/navbar";

const Matches = () => {
	return (
		<>
			<Navbar />
			<div>Matches</div>
		</>
	);
};

export default withApollo(Matches);
