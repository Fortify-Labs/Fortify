import { faAngleDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { FunctionComponent, useEffect } from "react";

export interface LayoutConfigs {
	verticalLayout: boolean;
	compactView: boolean;
	gapLess: boolean;
}

// --- Layouts ---
export const layouts: Record<string, LayoutConfigs> = {
	Horizontal: {
		verticalLayout: false,
		compactView: false,
		gapLess: true,
	},
	"Horizontal Compact": {
		verticalLayout: false,
		compactView: true,
		gapLess: true,
	},
	Vertical: {
		verticalLayout: true,
		compactView: false,
		gapLess: true,
	},
	"Vertical Compact": {
		verticalLayout: true,
		compactView: true,
		gapLess: false,
	},
};

export const PoolLayoutDropdown: FunctionComponent<{
	setVerticalLayout: React.Dispatch<React.SetStateAction<boolean>>;
	setCompactView: React.Dispatch<React.SetStateAction<boolean>>;
	setGapLess: React.Dispatch<React.SetStateAction<boolean>>;
}> = React.memo(({ setVerticalLayout, setCompactView, setGapLess }) => {
	// Load client side layout settings
	useEffect(() => {
		if (typeof window !== "undefined") {
			const layoutSetting = localStorage.getItem("poolLayout");

			if (layoutSetting) {
				const setting = layouts[layoutSetting];

				setVerticalLayout(setting.verticalLayout);
				setCompactView(setting.compactView);
				setGapLess(setting.gapLess);
			}
		}
	}, []);

	return (
		<div
			className="dropdown is-hoverable is-right"
			style={{ display: "inline-block", float: "right" }}
		>
			<div className="dropdown-trigger">
				<button
					className="button"
					aria-haspopup="true"
					aria-controls="dropdown-menu"
				>
					<span>Layout</span>
					<span className="icon has-text-info">
						<FontAwesomeIcon
							icon={faAngleDown}
							color="white"
							aria-hidden="true"
						/>
					</span>
				</button>
			</div>
			<div className="dropdown-menu" id="dropdown-menu" role="menu">
				<div className="dropdown-content">
					{Object.entries(layouts).map(([key, value]) => (
						<button
							className="dropdown-item button is-ghost"
							key={`layout_${key}`}
							onClick={() => {
								setVerticalLayout(value.verticalLayout);
								setCompactView(value.compactView);
								setGapLess(value.gapLess);
								localStorage.setItem("poolLayout", key);
							}}
						>
							{key}
						</button>
					))}
				</div>
			</div>
		</div>
	);
});
