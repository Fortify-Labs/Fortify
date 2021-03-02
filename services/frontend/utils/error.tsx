import { ApolloError } from "@apollo/client";
import Accordion from "components/accordion/accordion";

export const prettyError = (error: ApolloError, title?: string) => {
	return (
		<div style={{ margin: "1em", paddingBottom: "0.5em" }}>
			<Accordion title={title ?? `${error.name} - ${error.message}`}>
				<pre>{JSON.stringify(error, null, 2)}</pre>
			</Accordion>
		</div>
	);
};
