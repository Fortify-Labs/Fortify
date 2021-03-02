import React, { FunctionComponent, useState } from "react";
import classNames from "classnames";
import { PoolLayoutDropdown } from "components/poolLayoutDropdown";
import { MatchComponentProps } from "definitions/match";
import { PoolSizeHeading } from "./pool/poolSizeHeading";
import { PoolTiers } from "./pool/components";

export const PoolViewer: FunctionComponent<MatchComponentProps> = React.memo(
	({ id }) => {
		// --- Variables ---
		const [verticalLayout, setVerticalLayout] = useState(false);
		const [compactView, setCompactView] = useState(false);
		const [gapLess, setGapLess] = useState(true);

		return (
			<div className="content">
				<div>
					<PoolSizeHeading id={id} />
					<PoolLayoutDropdown
						setCompactView={setCompactView}
						setGapLess={setGapLess}
						setVerticalLayout={setVerticalLayout}
					/>
				</div>

				<div
					className={classNames("columns is-multiline", {
						"is-gapless": gapLess,
					})}
					style={{ marginTop: "0.4em" }}
				>
					<PoolTiers
						id={id}
						compactView={compactView}
						verticalLayout={verticalLayout}
					/>
				</div>
			</div>
		);
	}
);
