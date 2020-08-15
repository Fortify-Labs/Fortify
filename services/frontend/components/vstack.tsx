import React, { FunctionComponent, CSSProperties } from "react";

interface VStackProps {
	style?: CSSProperties;
	fullWidth?: boolean;

	onClick?: () => unknown;
}

export const VStack: FunctionComponent<VStackProps> = ({
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
