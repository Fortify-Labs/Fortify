import withApollo from "../lib/with-apollo";
import { Navbar } from "../components/navbar";

// import Link from "next/link";
// import { useVersionQuery } from "../gql/Version.graphql";

const Index = () => {
	return (
		<>
			<Navbar />
			<div>Index</div>
		</>
	);
};

export default withApollo(Index);
