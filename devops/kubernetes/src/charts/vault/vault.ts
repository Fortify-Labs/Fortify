import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { HelmChart } from "../../constructs/helmChart";
import { stripIndent } from "common-tags";
import { Certificate } from "../../../imports/cert-manager.io";
import { IngressRoute } from "../../../imports/traefik.containo.us";

export class VaultChart extends Chart {
	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, props);

		// Run: helm repo add hashicorp https://helm.releases.hashicorp.com

		new HelmChart(this, "vault", {
			chart: "hashicorp/vault",
			releaseName: "vault",
			values: {
				server: {
					service: {
						enabled: true,
						port: 8200,
						targetPort: 8200,
						annotations: {},
					},
					dataStorage: {
						enabled: true,
						size: "1Gi",
						mountPath: "/vault/data",
						storageClass: null,
						accessMode: "ReadWriteOnce",
						annotations: {},
					},
					auditStorage: {
						enabled: false,
						size: "1Gi",
						mountPath: "/vault/audit",
						storageClass: null,
						accessMode: "ReadWriteOnce",
						annotations: {},
					},
					dev: {
						enabled: false,
					},
					standalone: {
						enabled: false,
						config: stripIndent`
                          ui = true

                          listener "tcp" {
                            tls_disable = 1
                            address = "[::]:8200"
                            cluster_address = "[::]:8201"
                          }
                          storage "file" {
                            path = "/vault/data"
                          }
                        `,
					},
					ha: {
						enabled: true,
						replicas: 3,
						apiAddr: null,
						raft: {
							enabled: true,
							setNodeId: true,
							config: stripIndent`
                              ui = true

                              listener "tcp" {
                                tls_disable = 1
                                address = "[::]:8200"
                                cluster_address = "[::]:8201"
                              }
                      
                              storage "raft" {
                                path = "/vault/data"
                              }
                      
                              service_registration "kubernetes" {}
                          `,
						},
						config: stripIndent`
                          ui = true

                          listener "tcp" {
                            tls_disable = 1
                            address = "[::]:8200"
                            cluster_address = "[::]:8201"
                          }
                          storage "consul" {
                            path = "vault"
                            address = "HOST_IP:8500"
                          }
                    
                          service_registration "kubernetes" {}
                        `,
						disruptionBudget: {
							enabled: true,
							maxUnavailable: null,
						},
					},
				},
				ui: {
					enabled: true,
					publishNotReadyAddresses: true,
					activeVaultPodOnly: false,
					serviceType: "ClusterIP",
					serviceNodePort: null,
					externalPort: 8200,
					annotations: {},
				},
			},
		});

		new Certificate(this, "cert", {
			metadata: {
				name: "fortify-vault-ssl-cert",
				namespace: "default",
			},
			spec: {
				commonName: "fortify.dev",
				dnsNames: ["fortify.dev", "vault.fortify.dev"],
				issuerRef: {
					kind: "ClusterIssuer",
					name: "cf-letsencrypt",
				},
				secretName: "fortify-vault-ssl-cert",
			},
		});

		new IngressRoute(this, "ingress", {
			metadata: {
				name: "vault",
				namespace: "default",
			},
			spec: {
				entryPoints: ["websecure"],
				routes: [
					{
						kind: "Rule",
						match: "Host(`vault.fortify.dev`)",
						services: [
							{
								name: "vault-ui",
								namespace: "default",
								port: 8200,
							},
						],
					},
				],
				tls: {
					secretName: "fortify-vault-ssl-cert",
				},
			},
		});
	}
}
