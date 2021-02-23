import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { IngressRouteTcp } from "../../../imports/traefik.containo.us";
import { HelmChart } from "../../constructs/helmChart";

export class OpenVpnChart extends Chart {
	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, { ...props, namespace: "openvpn" });

		new HelmChart(this, "openvpn", {
			chart: "stable/openvpn",
			releaseName: "openvpn",
			values: {
				service: {
					type: "ClusterIP",
				},
				persistence: {
					enabled: true,
					accessMode: "ReadWriteOnce",
					size: "1Gi",
				},
			},
		});

		new IngressRouteTcp(this, "ingress", {
			metadata: {
				name: "openvpn",
			},
			spec: {
				entryPoints: ["vpn"],
				routes: [
					{
						kind: "Rule",
						match: "HostSNI(`*`)",
						services: [
							{
								name: "openvpn",
								port: 443,
							},
						],
					},
				],
			},
		});
	}
}
