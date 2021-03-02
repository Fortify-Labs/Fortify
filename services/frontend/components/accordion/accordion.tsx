import React, { useState, useRef, PropsWithChildren } from "react";
import Chevron from "./chevron";

function Accordion(props: PropsWithChildren<{ title: string }>) {
	const [setActive, setActiveState] = useState("");
	const [setHeight, setHeightState] = useState("0px");
	const [setRotate, setRotateState] = useState("accordion__icon");

	const content = useRef<HTMLDivElement>(null);

	function toggleAccordion() {
		setActiveState(setActive === "" ? "active" : "");
		setHeightState(
			setActive === "active"
				? "0px"
				: `${content.current?.scrollHeight ?? 0}px`
		);
		setRotateState(
			setActive === "active"
				? "accordion__icon"
				: "accordion__icon rotate"
		);
	}

	return (
		<div className="accordion__section">
			<button
				className={`accordion ${setActive}`}
				onClick={toggleAccordion}
			>
				<p className="accordion__title">{props.title}</p>
				<Chevron className={`${setRotate}`} width={10} fill={"#777"} />
			</button>
			<div
				ref={content}
				style={{ maxHeight: `${setHeight}` }}
				className="accordion__content"
			>
				<div className="accordion__text">{props.children}</div>
			</div>
		</div>
	);
}

export default Accordion;
