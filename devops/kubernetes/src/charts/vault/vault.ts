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
				global: {
					enabled: true,
					imagePullSecrets: [],
					tlsDisable: true,
					openshift: false,
					psp: {
						enable: false,
						annotations: stripIndent`
							seccomp.security.alpha.kubernetes.io/allowedProfileNames: docker/default,runtime/default
							apparmor.security.beta.kubernetes.io/allowedProfileNames: runtime/default
							seccomp.security.alpha.kubernetes.io/defaultProfileName:  runtime/default
							apparmor.security.beta.kubernetes.io/defaultProfileName:  runtime/default
						`,
					},
				},
				injector: {
					enabled: false,
					metrics: {
						enabled: false,
					},
					externalVaultAddr: "",
					image: {
						repository: "hashicorp/vault-k8s",
						tag: "0.6.0",
						pullPolicy: "IfNotPresent",
					},
					agentImage: {
						repository: "vault",
						tag: "1.5.4",
					},
					authPath: "auth/kubernetes",
					logLevel: "info",
					logFormat: "standard",
					revokeOnShutdown: false,
					namespaceSelector: {},
					certs: {
						secretName: null,
						caBundle: "",
						certName: "tls.crt",
						keyName: "tls.key",
					},
					resources: {},
					extraEnvironmentVars: {},
					affinity: null,
					tolerations: null,
					nodeSelector: null,
					priorityClassName: "",
					annotations: {},
				},
				server: {
					image: {
						repository: "vault",
						tag: "1.5.5",
						pullPolicy: "IfNotPresent",
					},
					updateStrategyType: "OnDelete",
					resources: {},
					ingress: {
						enabled: false,
						labels: {},
						annotations: {},
						hosts: [
							{
								host: "chart-example.local",
								paths: [],
							},
						],
						tls: [],
					},
					route: {
						enabled: false,
						labels: {},
						annotations: {},
						host: "chart-example.local",
					},
					authDelegator: {
						enabled: true,
					},
					extraInitContainers: null,
					extraContainers: null,
					shareProcessNamespace: false,
					extraArgs: "",
					readinessProbe: {
						enabled: true,
						failureThreshold: 2,
						initialDelaySeconds: 5,
						periodSeconds: 5,
						successThreshold: 1,
						timeoutSeconds: 3,
					},
					livenessProbe: {
						enabled: false,
						path: "/v1/sys/health?standbyok=true",
						failureThreshold: 2,
						initialDelaySeconds: 60,
						periodSeconds: 5,
						successThreshold: 1,
						timeoutSeconds: 3,
					},
					preStopSleepSeconds: 5,
					postStart: [],
					extraEnvironmentVars: {},
					extraSecretEnvironmentVars: [],
					extraVolumes: [],
					volumes: null,
					volumeMounts: null,
					affinity: stripIndent`
                        podAntiAffinity:
                          requiredDuringSchedulingIgnoredDuringExecution:
                            - labelSelector:
                                matchLabels:
                                  app.kubernetes.io/name: {{ template "vault.name" . }}
                                    app.kubernetes.io/instance: "{{ .Release.Name }}"
                                    component: server
                              topologyKey: kubernetes.io/hostname
                    `,
					tolerations: null,
					nodeSelector: null,
					networkPolicy: {
						enabled: false,
					},
					priorityClassName: "",
					extraLabels: {},
					annotations: {},
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
					serviceAccount: {
						create: true,
						name: "",
						annotations: {},
					},
					statefulSet: {
						annotations: {},
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
					name: "cf-letsencrypt-staging",
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
