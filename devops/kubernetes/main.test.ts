import { Testing } from "cdk8s";

import { Cluster } from "./src/cluster";
import { Fortify } from "./src/fortify";

describe("Placeholder", () => {
	test("Empty", () => {
		const app = Testing.app();
		const chart = new Fortify(app, "test-chart");
		const results = Testing.synth(chart);
		expect(results).toMatchSnapshot();
	});

	test("Empty Clean Cluster", () => {
		const app = Testing.app();
		const chart = new Cluster(app, "test-cluster");
		const results = Testing.synth(chart);
		expect(results).toMatchSnapshot();
	});
});
