import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { stripIndent } from "common-tags";
import { HelmChart } from "../../constructs/helmChart";

export class AkhqChart extends Chart {
	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, { ...props, namespace: "fortify" });

		// Run: helm repo add akhq https://akhq.io/

		new HelmChart(this, "akhq", {
			chart: "akhq/akhq",
			releaseName: "akhq",
			values: {
				configuration: stripIndent`
					akhq:
						server:
							access-log:
								enabled: false
								name: org.akhq.log.access
				`,
				secrets: stripIndent`
					akhq:
						connections:
							kafka-cluster-kafka-bootstrap:
								properties:
									bootstrap.servers: "fortify-kafka-bootstrap.kafka:9092"
				`,
				resources: {
					limits: {
						cpu: "500m",
						memory: "512Mi",
					},
					requests: {
						cpu: "100m",
						memory: "128Mi",
					},
				},
			},
		});
	}
}
