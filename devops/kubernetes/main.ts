import { config } from "dotenv";
config();

import { Construct } from "constructs";
import { App, Chart } from "cdk8s";

import {
	Gateway,
	GatewayOptions,
	GatewaySpecServersTlsMode,
} from "./imports/networking.istio.io/gateway";

import { FortifyDeployment } from "./src/deployment";
import { WebService } from "./src/webservice";
import { Certificate } from "./imports/cert-manager.io/certificate";
import { ClusterIssuer } from "./imports/cert-manager.io/clusterissuer";
import { Secret, ObjectMeta } from "./imports/k8s";

export interface CustomGatewayOptions extends GatewayOptions {
	metadata?: ObjectMeta;
}

const {
	ACME_SERVER,
	ACME_EMAIL,
	ACME_CF_EMAIL,
	CF_TOKEN,
	DOCKER_CONFIG_JSON,
	STAGING_ACME_SERVER,
	STAGING_ACME_EMAIL,
	STAGING_ACME_CF_EMAIL,
} = process.env;

export class MyChart extends Chart {
	constructor(scope: Construct, name: string) {
		super(scope, name, { namespace: "fortify" });

		// define resources here

		new Secret(this, "regcred", {
			metadata: {
				name: "regcred",
			},
			data: {
				".dockerconfigjson": Buffer.from(
					DOCKER_CONFIG_JSON ?? ""
				).toString("base64"),
			},
		});

		new Secret(this, "cloudflare-api-token", {
			metadata: {
				name: "cloudflare-api-token",
			},
			type: "Opaque",
			stringData: {
				"api-token": CF_TOKEN ?? "",
			},
		});

		new ClusterIssuer(this, "letsencrypt", {
			metadata: {
				name: "letsencrypt",
			},
			spec: {
				acme: {
					server: ACME_SERVER ?? "",
					email: ACME_EMAIL ?? "",
					privateKeySecretRef: {
						name: "issuer-account-key",
					},
					solvers: [
						{
							dns01: {
								cloudflare: {
									email: ACME_CF_EMAIL ?? "",
									apiTokenSecretRef: {
										name: "cloudflare-api-token",
										key: "api-token",
									},
								},
							},
						},
					],
				},
			},
		});

		new ClusterIssuer(this, "letsencrypt-staging", {
			metadata: {
				name: "letsencrypt-staging",
			},
			spec: {
				acme: {
					server: STAGING_ACME_SERVER ?? "",
					email: STAGING_ACME_EMAIL ?? "",
					privateKeySecretRef: {
						name: "staging-issuer-account-key",
					},
					solvers: [
						{
							dns01: {
								cloudflare: {
									email: STAGING_ACME_CF_EMAIL ?? "",
									apiTokenSecretRef: {
										name: "cloudflare-api-token",
										key: "api-token",
									},
								},
							},
						},
					],
				},
			},
		});

		new Certificate(this, "fortify-ssl-cert", {
			metadata: {
				name: "fortify-ssl-cert",
			},
			spec: {
				secretName: "fortify-ssl-cert",
				commonName: "fortify.gg",
				dnsNames: ["fortify.gg", "api.fortify.gg", "gsi.fortify.gg"],
				issuerRef: {
					name: "letsencrypt",
				},
			},
		});

		new Gateway(this, "fortify-gateway", {
			metadata: {
				name: "fortify-gateway",
			},
			spec: {
				selector: {
					istio: "ingressgateway",
				},
				servers: [
					{
						port: {
							number: 443,
							name: "https",
							protocol: "HTTPS",
						},
						tls: {
							mode: GatewaySpecServersTlsMode.SIMPLE,
							credentialName: "fortify-ssl-cert",
						},
						hosts: [
							"fortify.gg",
							"api.fortify.gg",
							"gsi.fortify.gg",
						],
					},
				],
			},
		} as CustomGatewayOptions);

		new WebService(this, "backend", {
			name: "backend",
			service: {
				name: "backend",
				containerPort: 8080,
				port: 8080,
			},
			gateways: ["fortify-gateway"],
			hosts: ["api.fortify.gg"],
			http: [
				{
					route: [
						{
							destination: {
								port: {
									number: 8080,
								},
								host: "backend",
							},
						},
					],
				},
			],
		});

		new WebService(this, "frontend", {
			name: "frontend",
			service: {
				name: "frontend",
				containerPort: 3000,
				port: 8080,
			},
			gateways: ["fortify-gateway"],
			hosts: ["fortify.gg"],
			http: [
				{
					route: [
						{
							destination: {
								port: {
									number: 8080,
								},
								host: "frontend",
							},
						},
					],
				},
			],
		});

		new WebService(this, "gsi-receiver", {
			name: "gsi-receiver",
			service: {
				name: "gsi-receiver",
				containerPort: 8080,
				port: 8080,
			},
			gateways: ["fortify-gateway"],
			hosts: ["gsi.fortify.gg"],
			http: [
				{
					route: [
						{
							destination: {
								port: {
									number: 8080,
								},
								host: "gsi-receiver",
							},
						},
					],
				},
			],
		});

		new FortifyDeployment(this, "17kmmrbot", {
			name: "17kmmrbot",
		});

		new FortifyDeployment(this, "fsm", {
			name: "fsm",
		});
	}
}

const app = new App();
new MyChart(app, "fortify");
app.synth();
