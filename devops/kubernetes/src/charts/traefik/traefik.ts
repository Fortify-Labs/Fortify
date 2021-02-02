import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { HelmChart } from "../../constructs/helmChart";

export class TraefikChart extends Chart {
	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, { ...props, namespace: "kube-system" });

		// Run: helm repo add traefik https://helm.traefik.io/traefik

		new HelmChart(this, "traefik", {
			chart: "traefik/traefik",
			releaseName: "traefik",
			values: {
				image: {
					name: "traefik",
					tag: "2.3.1",
					pullPolicy: "IfNotPresent",
				},
				deployment: {
					enabled: true,
					replicas: 3,
					annotations: {},
					podAnnotations: {},
					additionalContainers: [],
					additionalVolumes: [],
					initContainers: [],
				},
				podDisruptionBudget: {
					enabled: true,
					maxUnavailable: 1,
				},
				ingressClass: {
					enabled: false,
					isDefaultClass: false,
				},
				pilot: {
					enabled: false,
					token: "",
				},
				experimental: {
					plugins: {
						enabled: false,
					},
				},
				ingressRoute: {
					dashboard: {
						enabled: true,
						annotations: {},
						labels: {},
					},
				},
				rollingUpdate: {
					maxUnavailable: 1,
					maxSurge: 1,
				},
				providers: {
					kubernetesCRD: {
						enabled: true,
					},
					kubernetesIngress: {
						enabled: true,
						publishedService: {
							enabled: false,
						},
					},
				},
				volumes: [],
				logs: {
					general: {
						level: "ERROR",
					},
					access: {
						enabled: false,
						filters: {},
						fields: {
							general: {
								defaultmode: "keep",
								names: {},
							},
							headers: {
								defaultmode: "drop",
								names: {},
							},
						},
					},
				},
				globalArguments: ["--global.checknewversion"],
				additionalArguments: [],
				env: [],
				envFrom: [],
				ports: {
					traefik: {
						port: 9000,
						expose: false,
						exposedPort: 9000,
						protocol: "TCP",
					},
					web: {
						port: 8000,
						expose: true,
						exposedPort: 80,
						protocol: "TCP",
						redirectTo: "websecure",
					},
					websecure: {
						port: 8443,
						expose: true,
						exposedPort: 443,
						protocol: "TCP",
					},
				},
				service: {
					enabled: true,
					type: "LoadBalancer",
					annotations: {},
					labels: {},
					spec: {},
					loadBalancerSourceRanges: [],
					externalIPs: [],
				},
				autoscaling: {
					enabled: false,
				},
				persistence: {
					enabled: false,
					accessMode: "ReadWriteOnce",
					size: "128Mi",
					path: "/data",
					annotations: {},
				},
				hostNetwork: false,
				rbac: {
					enabled: true,
					namespaced: false,
				},
				podSecurityPolicy: {
					enabled: false,
				},
				serviceAccount: {
					name: "",
				},
				serviceAccountAnnotations: {},
				resources: {},
				affinity: {
					podAntiAffinity: {
						requiredDuringSchedulingIgnoredDuringExecution: [
							{
								labelSelector: {
									matchLabels: {
										"app.kubernetes.io/instance": "traefik",
										"app.kubernetes.io/name": "traefik",
										"app.kubernetes.io/managed-by": "Helm",
									},
								},
								topologyKey: "kubernetes.io/hostname",
							},
						],
					},
				},
				nodeSelector: {},
				tolerations: [],
				priorityClassName: "",
				securityContext: {
					capabilities: {
						drop: ["ALL"],
					},
					readOnlyRootFilesystem: true,
					runAsGroup: 65532,
					runAsNonRoot: true,
					runAsUser: 65532,
				},
				podSecurityContext: {
					fsGroup: 65532,
				},
			},
		});
	}
}
