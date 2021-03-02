import React, { useEffect, useRef } from "react";
import SvgGauge from "svg-gauge";

export interface GaugeOptions {
	dialStartAngle?: number;
	dialEndAngle?: number;
	radius?: number;
	min?: number;
	max?: number;
	label?: () => string;
	showValue?: boolean;
	gaugeClass?: string;
	dialClass?: string;
	valueDialClass?: string;
	valueClass?: string;
	color?: (value: number) => string;
	viewBox?: string;

	value?: number;

	style?: React.CSSProperties;
}

const defaultOptions = {
	animDuration: 1,
	showValue: true,
	initialValue: 0,
	min: 0,
	max: 100,
};

const Gauge = (props: GaugeOptions) => {
	const gaugeEl = useRef<HTMLDivElement>(null);
	const gaugeRef = useRef<any>(null);

	useEffect(() => {
		if (!gaugeRef.current) {
			const options = { ...defaultOptions, ...props };
			gaugeRef.current = SvgGauge(gaugeEl.current, options);

			gaugeRef.current.setValue(options.initialValue);
		}

		gaugeRef.current.setMaxValue(props.max || 1);
		gaugeRef.current.setValueAnimated(props.value ?? 0, 1);
	}, [props]);

	return (
		<div ref={gaugeEl} className="gauge-container" style={props.style} />
	);
};

export default Gauge;
