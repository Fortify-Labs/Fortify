import React, { FunctionComponent } from "react";
import classNames from "classnames";
import { createPoolLayoutDropdown } from "components/poolLayoutDropdown";
import { MatchComponentProps } from "definitions/match";
import { PoolSizeHeading } from "./pool/poolSizeHeading";
import { PoolTiers } from "./pool/components";

export const PoolViewer: FunctionComponent<MatchComponentProps> = React.memo(
	({ id }) => {
		// --- UI variables ---
		const {
			PoolLayoutDropdown,
			verticalLayout,
			compactView,
			gapLess,
		} = createPoolLayoutDropdown();

		return (
			<div className="content">
				<div>
					<PoolSizeHeading id={id} />
					<PoolLayoutDropdown />
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
