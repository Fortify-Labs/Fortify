import { FunctionComponent, useRef, useEffect } from "react";

import * as d3 from "d3";
import { useWindowSize } from "lib/useWindowSize";

export const LineChart: FunctionComponent<{
	yName?: string;
	xName?: string;
	data: {
		date: string;
		value: number;
	}[];
	margin?: {
		top: number;
		left: number;
		bottom: number;
		right: number;
	};
}> = ({
	data,
	xName,
	yName,
	margin = { top: 20, right: 30, bottom: 30, left: 40 },
}) => {
	const windowSize = useWindowSize();
	const ref = useRef<SVGSVGElement>(null);

	useEffect(() => {
		const width = ref.current?.clientWidth ?? 0;
		const height = ref.current?.clientHeight ?? 0;

		const svg = d3.select(ref.current);

		svg.selectAll("*").remove();

		const dateExtent = d3.extent(data, (d) => new Date(d.date));

		const x = d3
			.scaleUtc()
			.domain(dateExtent[0] ? dateExtent : [])
			.range([margin.left, width - margin.right]);
		const xAxis = (
			g: d3.Selection<SVGGElement, unknown, null, undefined>
		) =>
			g
				.attr("transform", `translate(0,${height - margin.bottom})`)
				.call(
					d3
						.axisBottom(x)
						.ticks(width / 80)
						.tickSizeOuter(0)
				)
				.call((g) =>
					g
						.select(".tick:last-of-type text")
						.clone()
						.attr("y", -10)
						.attr("text-anchor", "start")
						.attr("font-weight", "bold")
						.text(xName ?? "")
				);

		const valueExtent = d3.extent(data, (d) => d.value);
		const y = d3
			.scaleLinear()
			.domain(valueExtent[0] ? valueExtent : [])
			// .domain([0, d3.max(data, (d) => d.value) ?? 0])
			.nice()
			.range([height - margin.bottom, margin.top]);

		const yAxis = (
			g: d3.Selection<SVGGElement, unknown, null, undefined>
		) =>
			g
				.attr("transform", `translate(${margin.left},0)`)
				.call(d3.axisLeft(y))
				.call((g) => g.select(".domain").remove())
				.call((g) =>
					g
						.select(".tick:last-of-type text")
						.clone()
						.attr("x", 3)
						.attr("text-anchor", "start")
						.attr("font-weight", "bold")
						.text(yName ?? "")
				);

		const line = d3
			.line<typeof data[0]>()
			.defined((d) => !isNaN(d.value))
			.x((d) => x(new Date(d.date)) ?? 0)
			.y((d) => y(d.value) ?? 0);

		svg.append("g").call(xAxis);
		svg.append("g").call(yAxis);
		svg.append("path")
			.datum(data)
			.attr("fill", "none")
			.attr("stroke", "steelblue")
			.attr("stroke-width", 1.5)
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("d", line);
	}, [data, windowSize]);

	return <svg ref={ref} style={{ width: "100%", height: "40vh" }} />;
};
