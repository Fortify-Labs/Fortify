import withApollo from "../../lib/with-apollo";
import { Navbar } from "../../components/navbar";
import { useRouter } from "next/router";

const Profile = () => {
	const router = useRouter();
	const { id } = router.query;

	return (
		<>
			<Navbar />
			<div>Profile {id}</div>
		</>
	);
};

export default withApollo(Profile);
