import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { Certificate } from "../../../imports/cert-manager.io";
import { IngressRoute } from "../../../imports/traefik.containo.us";
import { HelmChart } from "../../constructs/helmChart";

export class KowlChart extends Chart {
	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, { ...props, namespace: "fortify" });

		// Run: helm repo add cloudhut https://raw.githubusercontent.com/cloudhut/charts/master/archives

		new HelmChart(this, "kowl", {
			chart: "cloudhut/kowl",
			releaseName: "kowl",
			values: {
				replicaCount: 1,
				image: {
					repository: "quay.io/cloudhut/kowl",
					pullPolicy: "IfNotPresent",
					tag: "",
				},
				imagePullSecrets: [],
				nameOverride: "",
				fullnameOverride: "",
				serviceAccount: {
					create: true,
					annotations: {},
					name: "",
				},
				podAnnotations: {},
				podSecurityContext: {
					runAsUser: 99,
					fsGroup: 99,
				},
				securityContext: {
					runAsNonRoot: true,
				},
				service: {
					type: "ClusterIP",
					port: 80,
					annotations: {},
				},
				ingress: {
					enabled: false,
					annotations: {},
					hosts: [
						{
							host: "chart-example.local",
							paths: [],
						},
					],
					tls: [],
				},
				resources: {},
				autoscaling: {
					enabled: false,
					minReplicas: 1,
					maxReplicas: 100,
					targetCPUUtilizationPercentage: 80,
				},
				nodeSelector: {},
				tolerations: [],
				affinity: {},
				kowl: {
					config: {
						kafka: {
							brokers: ["fortify-kafka-bootstrap.kafka:9092"],
						},
					},
				},
				secret: {
					existingSecret: null,
					kafka: {},
					cloudhut: {},
					login: {
						google: {},
						github: {},
					},
				},
			},
		});

		new Certificate(this, "cert", {
			metadata: {
				name: "fortify-kowl-ssl-cert",
				namespace: "fortify",
			},
			spec: {
				commonName: "fortify.dev",
				dnsNames: ["fortify.dev", "kowl.fortify.dev"],
				issuerRef: {
					kind: "ClusterIssuer",
					name: "cf-letsencrypt",
				},
				secretName: "fortify-kowl-ssl-cert",
			},
		});

		new IngressRoute(this, "ingress", {
			metadata: {
				name: "kowl",
				namespace: "fortify",
			},
			spec: {
				entryPoints: ["websecure"],
				routes: [
					{
						kind: "Rule",
						match: "Host(`kowl.fortify.dev`)",
						middlewares: [
							{
								name: "basic-auth",
								namespace: "kube-system",
							},
						],
						services: [
							{
								name: "kowl",
								namespace: "fortify",
								port: 80,
							},
						],
					},
				],
				tls: {
					secretName: "fortify-kowl-ssl-cert",
				},
			},
		});
	}
}
