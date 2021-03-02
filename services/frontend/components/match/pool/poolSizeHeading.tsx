import { MatchComponentProps } from "definitions/match";
import { useMatchQuery } from "gql/Match.graphql";
import React, { FunctionComponent } from "react";
import { poolCalculations } from "utils/pool";

export const PoolSizeHeading: FunctionComponent<MatchComponentProps> = React.memo(
	({ id }) => {
		const { data } = useMatchQuery({ variables: { id } });
		const { remainingUnits, totalPoolSize } = poolCalculations(data);

		return (
			<h4 className="title is-4" style={{ display: "inline-block" }}>
				Total Pool Size: {remainingUnits}/{totalPoolSize}
			</h4>
		);
	}
);
