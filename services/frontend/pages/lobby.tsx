import withApollo from "../lib/with-apollo";
import { Navbar } from "../components/navbar";

const Lobby = () => {
	return (
		<>
			<Navbar />
			<div>Lobby</div>
		</>
	);
};

export default withApollo(Lobby);
