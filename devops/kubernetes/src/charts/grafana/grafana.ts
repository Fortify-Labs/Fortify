import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { Certificate } from "../../../imports/cert-manager.io";
import { KubeDeployment, KubeService } from "../../../imports/k8s";
import { IngressRoute } from "../../../imports/traefik.containo.us";
import { HelmChart } from "../../constructs/helmChart";

const { GRAFANA_GITHUB_CLIENT_ID, GRAFANA_GITHUB_CLIENT_SECRET } = process.env;

export class GrafanaChart extends Chart {
	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, props);

		new HelmChart(this, "grafana", {
			chart: "grafana/grafana",
			releaseName: "grafana",
			values: {
				image: {
					tag: "7.4.0",
				},
				replicas: 1,
				persistence: {
					type: "pvc",
					enabled: true,
					accessModes: ["ReadWriteOnce"],
					size: "1Gi",
					finalizers: ["kubernetes.io/pvc-protection"],
				},
				"grafana.ini": {
					paths: {
						data: "/var/lib/grafana/data",
						logs: "/var/log/grafana",
						plugins: "/var/lib/grafana/plugins",
						provisioning: "/etc/grafana/provisioning",
					},
					analytics: {
						check_for_updates: true,
					},
					log: {
						mode: "console",
					},
					grafana_net: {
						url: "https://grafana.net",
					},
					server: {
						domain: "grafana.fortify.dev",
						root_url: "https://%(domain)s/",
					},
					"auth.github": {
						enabled: true,
						allow_sign_up: true,
						scopes: "user:email,read:org",
						auth_url: "https://github.com/login/oauth/authorize",
						token_url:
							"https://github.com/login/oauth/access_token",
						api_url: "https://api.github.com/user",
						team_ids: "3934849",
						// allowed_organizations: "fortify-labs",
						client_id: GRAFANA_GITHUB_CLIENT_ID,
						client_secret: GRAFANA_GITHUB_CLIENT_SECRET,
					},
				},
				env: {
					GF_RENDERING_CALLBACK_URL: "http://grafana:80/",
					GF_RENDERING_SERVER_URL:
						"http://grafana-image-renderer:8081/render",
				},
			},
		});

		new Certificate(this, "cert", {
			metadata: {
				name: "fortify-grafana-ssl-cert",
				namespace: "fortify",
			},
			spec: {
				commonName: "fortify.dev",
				dnsNames: ["fortify.dev", "grafana.fortify.dev"],
				issuerRef: {
					kind: "ClusterIssuer",
					name: "cf-letsencrypt",
				},
				secretName: "fortify-grafana-ssl-cert",
			},
		});

		new IngressRoute(this, "ingress", {
			metadata: {
				name: "grafana",
				namespace: "fortify",
			},
			spec: {
				entryPoints: ["websecure"],
				routes: [
					{
						kind: "Rule",
						match: "Host(`grafana.fortify.dev`)",
						services: [
							{
								name: "grafana",
								namespace: "default",
								port: 80,
							},
						],
					},
				],
				tls: {
					secretName: "fortify-grafana-ssl-cert",
				},
			},
		});

		new KubeDeployment(this, "image-renderer", {
			metadata: {
				name: "grafana-image-renderer",
			},
			spec: {
				selector: {
					matchLabels: {
						app: "grafana-image-renderer",
					},
				},
				template: {
					metadata: {
						labels: {
							app: "grafana-image-renderer",
						},
					},
					spec: {
						containers: [
							{
								name: "grafana-image-renderer",
								image: "grafana/grafana-image-renderer:latest",
								ports: [
									{
										name: "http",
										containerPort: 8081,
									},
								],
								env: [
									{
										name: "HTTP_HOST",
										value: "0.0.0.0",
									},
								],
								volumeMounts: [
									{
										name: "tmpfs",
										mountPath: "/tmp",
									},
								],
							},
						],
						volumes: [
							{
								name: "tmpfs",
								emptyDir: {},
							},
						],
					},
				},
			},
		});

		new KubeService(this, "image-renderer-service", {
			metadata: {
				name: "grafana-image-renderer",
			},
			spec: {
				selector: {
					app: "grafana-image-renderer",
				},
				ports: [
					{
						port: 8081,
						name: "http",
						targetPort: "http",
					},
				],
			},
		});
	}
}
