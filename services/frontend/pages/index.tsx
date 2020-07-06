import withApollo from "../lib/with-apollo";
// import Link from "next/link";
// import { useVersionQuery } from "../gql/Version.graphql";

const Index = () => {
	// const { data } = useVersionQuery();

	// if (data) {
	// 	const { version } = data;
	// 	return (
	// 		<div>
	// 			Current API Version: {version} goto{" "}
	// 			<Link href="/about">
	// 				<a>static</a>
	// 			</Link>{" "}
	// 			page.
	// 		</div>
	// 	);
	// }

	// return <div>...</div>;

	return <div>Soon(tm)</div>;
};

export default withApollo(Index);
