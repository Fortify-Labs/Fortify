import { Navbar } from "../components/navbar";
import withApollo from "../lib/with-apollo";

const Imprint = () => {
	return (
		<>
			<Navbar />
			Imprint
		</>
	);
};

export default withApollo(Imprint);
