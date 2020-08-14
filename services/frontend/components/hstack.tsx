import React, { FunctionComponent, CSSProperties } from "react";

interface HStackProps {
	style?: CSSProperties;
	fullWidth?: boolean;

	onClick?: () => unknown;
}

export const HStack: FunctionComponent<HStackProps> = ({
	fullWidth,
	children,
	style,
	onClick,
}) => {
	return (
		<div
			onClick={onClick}
			style={{
				display: "inline-grid",
				...(fullWidth ? { width: "100%" } : {}),
				...style,
			}}
		>
			{children}
		</div>
	);
};
