import { Testing } from "cdk8s";

import { Fortify } from "./main";
import { ClusterSetup } from "./src/charts/cluster";
import { ClusterSetupClean } from "./src/charts/clusterClean";

describe("Placeholder", () => {
	test("Empty", () => {
		const app = Testing.app();
		const chart = new Fortify(app, "test-chart");
		const results = Testing.synth(chart);
		expect(results).toMatchSnapshot();
	});

	test("Empty Cluster", () => {
		const app = Testing.app();
		const chart = new ClusterSetup(app, "test-cluster");
		const results = Testing.synth(chart);
		expect(results).toMatchSnapshot();
	});

	test("Empty Clean Cluster", () => {
		const app = Testing.app();
		const chart = new ClusterSetupClean(app, "test-cluster");
		const results = Testing.synth(chart);
		expect(results).toMatchSnapshot();
	});
});
