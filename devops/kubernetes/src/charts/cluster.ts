import { Chart } from "cdk8s";
import { Construct } from "constructs";
import {
	KubeNamespace,
	KubeSecret,
	KubeServiceAccount,
	KubeClusterRole,
	KubeClusterRoleBinding,
	KubeConfigMap,
	KubeDaemonSet,
	KubeStatefulSet,
	KubeService,
	ObjectMeta,
} from "../../imports/k8s";
import {
	Kafka,
	KafkaSpecKafkaStorageType,
	KafkaSpecKafkaStorageVolumesType,
	KafkaSpecZookeeperStorageType,
	KafkaOptions,
} from "../../imports/kafka.strimzi.io/kafka";

import {
	KafkaTopic,
	KafkaTopicOptions,
} from "../../imports/kafka.strimzi.io/kafkatopic";
import { Postgres } from "../../imports/kubedb.com/postgres";
import { RedisFailover } from "../../imports/databases.spotahome.com/redisfailover";
import { RedisCommander } from "../redis-commander";
import { Elasticsearch } from "../../imports/elasticsearch.k8s.elastic.co/elasticsearch";
import { Kibana } from "../../imports/kibana.k8s.elastic.co/kibana";
import { kubernetesConf } from "../fluentd/config";
import {
	Gateway,
	GatewaySpecServersTlsMode,
	GatewayOptions,
} from "../../imports/networking.istio.io/gateway";
import {
	VirtualService,
	VirtualServiceOptions,
} from "../../imports/networking.istio.io/virtualservice";
import { ClusterIngress } from "../cluster/ingress";
import { Certificate } from "../../imports/cert-manager.io/certificate";

const {
	DOMAIN = "fortify.gg",
	POSTGRES_PASSWORD = "",
	ENVIRONMENT = "prod",
} = process.env;

const hosts = [DOMAIN, `api.${DOMAIN}`, `gsi.${DOMAIN}`];

const devHosts = [
	`akhq-${ENVIRONMENT}.fortify.dev`,
	`redis-commander-${ENVIRONMENT}.fortify.dev`,
	`influxdb-${ENVIRONMENT}.fortify.dev`,
	`kibana-${ENVIRONMENT}.fortify.dev`,
	`fortify.dev`,
];

export interface CustomGatewayOptions extends GatewayOptions {
	metadata?: ObjectMeta;
}

export interface CustomKafkaOptions extends KafkaOptions {
	metadata?: ObjectMeta;
}

export interface CustomKafkaTopicOptions extends KafkaTopicOptions {
	metadata?: ObjectMeta;
}

export class ClusterSetup extends Chart {
	constructor(scope: Construct, name: string) {
		super(scope, name, { namespace: "fortify" });

		new KubeNamespace(this, "fortify-namespace", {
			metadata: {
				name: "fortify",
				namespace: undefined,
				labels: {
					"istio-injection": "enabled",
				},
			},
		});

		// --- Kafka setup ---

		new KubeNamespace(this, "kafka-namespace", {
			metadata: {
				name: "kafka",
				namespace: undefined,
			},
		});

		new Kafka(this, "kafka", {
			metadata: {
				name: "fortify",
				namespace: "kafka",
			},
			spec: {
				kafka: {
					version: "2.5.0",
					replicas: 3,
					listeners: {
						plain: {},
						tls: {},
					},
					config: {
						"offsets.topic.replication.factor": 1,
						"transaction.state.log.replication.factor": 1,
						"transaction.state.log.min.isr": 1,
						"log.message.format.version": "2.5",
					},
					storage: {
						type: KafkaSpecKafkaStorageType.JBOD,
						volumes: [
							{
								id: 0,
								type:
									KafkaSpecKafkaStorageVolumesType.PERSISTENT_CLAIM,
								size: "100Gi",
								deleteClaim: false,
							},
						],
					},
				},
				zookeeper: {
					replicas: 3,
					storage: {
						type: KafkaSpecZookeeperStorageType.PERSISTENT_CLAIM,
						size: "100Gi",
						deleteClaim: false,
					},
					template: {
						pod: {
							metadata: {
								annotations: {
									"sidecar.istio.io/inject": false,
								},
							},
						},
					},
				},
				entityOperator: {
					topicOperator: {},
				},
			},
		} as CustomKafkaOptions);

		new KafkaTopic(this, "gsi-topic", {
			metadata: {
				name: "gsi",
				namespace: "kafka",
				labels: {
					"strimzi.io/cluster": "fortify",
				},
			},
			spec: {
				partitions: 3,
				replicas: 2,
				config: {
					"retention.ms": 7 * 86400000, // 7 * 1 day,
					"segment.ms": 86400000, // 1 day
					"segment.bytes": 1073741824, // 1 GB
				},
			},
		} as CustomKafkaTopicOptions);

		new KafkaTopic(this, "game-events-topic", {
			metadata: {
				name: "game-events",
				namespace: "kafka",
				labels: {
					"strimzi.io/cluster": "fortify",
				},
			},
			spec: {
				partitions: 3,
				replicas: 2,
				config: {
					"retention.ms": 7 * 86400000, // 7 * 1 day,
					"segment.ms": 86400000, // 1 day
					"segment.bytes": 1073741824, // 1 GB
				},
			},
		} as CustomKafkaTopicOptions);

		new KafkaTopic(this, "system-events-topic", {
			metadata: {
				name: "system-events",
				namespace: "kafka",
				labels: {
					"strimzi.io/cluster": "fortify",
				},
			},
			spec: {
				partitions: 3,
				replicas: 2,
				config: {
					"retention.ms": 7 * 86400000, // 7 * 1 day,
					"segment.ms": 86400000, // 1 day
					"segment.bytes": 1073741824, // 1 GB
				},
			},
		} as CustomKafkaTopicOptions);

		// --- Postgres setup ---

		new KubeNamespace(this, "postgres-namespace", {
			metadata: {
				name: "postgres",
				namespace: undefined,
				labels: {
					// "istio-injection": "enabled",
				},
			},
		});

		new KubeSecret(this, "postgres-auth", {
			metadata: {
				name: "postgres-auth",
				namespace: "postgres",
			},
			stringData: {
				POSTGRES_USER: "postgres",
				POSTGRES_PASSWORD,
			},
		});

		new Postgres(this, "postgres", {
			metadata: {
				name: "postgres",
				namespace: "postgres",
			},
			spec: {
				version: "11.2",
				replicas: 3,
				storageType: "Durable",
				storage: {
					storageClassName: "longhorn",
					accessModes: ["ReadWriteOnce"],
					resources: {
						requests: {
							storage: "10Gi",
						},
					},
				},
				databaseSecret: {
					secretName: "postgres-auth",
				},
				podTemplate: {
					spec: {
						affinity: {
							podAntiAffinity: {
								preferredDuringSchedulingIgnoredDuringExecution: [
									{
										weight: 1,
										podAffinityTerm: {
											labelSelector: {
												matchExpressions: [
													{
														key: "kubedb.com/name",
														operator: "In",
														values: ["postgres"],
													},
												],
											},
											topologyKey:
												"kubernetes.io/hostname",
										},
									},
								],
							},
						},
					},
				},
			},
		});

		// --- Redis setup ---

		new KubeNamespace(this, "redis-namespace", {
			metadata: {
				name: "redis",
				namespace: undefined,
				labels: {
					// "istio-injection": "enabled",
				},
			},
		});

		new RedisFailover(this, "redis", {
			metadata: {
				name: "redis",
				namespace: "redis",
			},
			spec: {
				sentinel: {
					replicas: 3,
				},
				redis: {
					replicas: 3,
					storage: {
						keepAfterDeletion: true,
						persistentVolumeClaim: {
							metadata: {
								name: "redisfailover-persistent-keep-data",
							},
							spec: {
								accessModes: ["ReadWriteOnce"],
								resources: {
									requests: {
										storage: "10Gi",
									},
								},
							},
						},
					},
				},
			},
		});

		new RedisCommander(this, "redis-commander", {
			SENTINEL_HOST: "rfs-redis.redis",
			SENTINEL_PORT: "26379",
		});

		// --- Logs ---

		new KubeNamespace(this, "logs-namespace", {
			metadata: {
				name: "logs",
				namespace: undefined,
				labels: {
					// "istio-injection": "enabled",
				},
			},
		});

		// --- ElasticSearch setup ---

		new Elasticsearch(this, "elasticsearch", {
			metadata: {
				name: "elasticsearch",
				namespace: "logs",
			},
			spec: {
				version: "7.8.1",
				http: {
					tls: {
						selfSignedCertificate: {
							disabled: true,
						},
					},
				},
				nodeSets: [
					{
						name: "default",
						count: 3,
						config: {
							"node.master": true,
							"node.data": true,
							"node.ingest": true,
						},
						podTemplate: {
							// metadata: {
							// 	annotations: {
							// 		"traffic.sidecar.istio.io/includeInboundPorts":
							// 			"*",
							// 		"traffic.sidecar.istio.io/excludeOutboundPorts":
							// 			"9300",
							// 		"traffic.sidecar.istio.io/excludeInboundPorts":
							// 			"9300",
							// 	},
							// },
							spec: {
								automountServiceAccountToken: true,
								initContainers: [
									{
										name: "sysctl",
										securityContext: {
											privileged: true,
										},
										command: [
											"sh",
											"-c",
											"sysctl -w vm.max_map_count=262144",
										],
									},
								],
							},
						},
						volumeClaimTemplates: [
							{
								metadata: {
									name: "elasticsearch-data",
								},
								spec: {
									accessModes: ["ReadWriteOnce"],
									resources: {
										requests: {
											storage: "100Gi",
										},
									},
								},
							},
						],
					},
				],
			},
		});

		new Kibana(this, "kibana", {
			metadata: {
				name: "kibana",
				namespace: "logs",
			},
			spec: {
				version: "7.8.1",
				count: 1,
				elasticsearchRef: {
					name: "elasticsearch",
				},
				http: {
					tls: {
						selfSignedCertificate: {
							disabled: true,
						},
					},
				},
			},
		});

		// --- Fluentd setup ---

		new KubeServiceAccount(this, "fluentd-service-account", {
			metadata: {
				name: "fluentd",
				namespace: "logs",
			},
		});

		new KubeClusterRole(this, "fluentd-cluster-role", {
			metadata: {
				name: "fluentd",
				namespace: "logs",
			},
			rules: [
				{
					apiGroups: [""],
					resources: ["pods", "namespaces"],
					verbs: ["get", "list", "watch"],
				},
			],
		});

		new KubeClusterRoleBinding(this, "fluentd-cluster-role-binding", {
			metadata: {
				name: "fluentd",
			},
			roleRef: {
				kind: "ClusterRole",
				name: "fluentd",
				apiGroup: "rbac.authorization.k8s.io",
			},
			subjects: [
				{
					kind: "ServiceAccount",
					name: "fluentd",
					namespace: "logs",
				},
			],
		});

		new KubeConfigMap(this, "fluentd-config", {
			metadata: {
				name: "fluentd-kubernetes-conf",
				namespace: "logs",
			},
			data: {
				"kubernetes.conf": kubernetesConf,
			},
		});

		const fluentDsLabels = {
			"k8s-app": "fluentd-logging",
			version: "v1",
		};

		new KubeDaemonSet(this, "fluentd-ds", {
			metadata: {
				name: "fluentd",
				namespace: "logs",
				labels: fluentDsLabels,
			},
			spec: {
				selector: {
					matchLabels: fluentDsLabels,
				},
				template: {
					metadata: {
						labels: fluentDsLabels,
						annotations: {
							"sidecar.istio.io/inject": "false",
						},
					},
					spec: {
						serviceAccount: "fluentd",
						serviceAccountName: "fluentd",
						tolerations: [
							{
								key: "node-role.kubernetes.io/master",
								effect: "NoSchedule",
							},
						],
						containers: [
							{
								name: "fluentd",
								image:
									"fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch",
								env: [
									{
										name: "FLUENT_ELASTICSEARCH_HOST",
										value: "elasticsearch-es-http",
									},
									{
										name: "FLUENT_ELASTICSEARCH_PORT",
										value: "9200",
									},
									{
										name: "FLUENT_ELASTICSEARCH_SCHEME",
										value: "http",
									},
									// Option to configure elasticsearch plugin with self signed certs
									{
										name: "FLUENT_ELASTICSEARCH_SSL_VERIFY",
										value: "true",
									},
									// Option to configure elasticsearch plugin with tls
									{
										name:
											"FLUENT_ELASTICSEARCH_SSL_VERSION",
										value: "TLSv1_2",
									},
									// X-Pack Authentication
									{
										name: "FLUENT_ELASTICSEARCH_USER",
										value: "elastic",
									},
									{
										name: "FLUENT_ELASTICSEARCH_PASSWORD",
										valueFrom: {
											secretKeyRef: {
												key: "elastic",
												name:
													"elasticsearch-es-elastic-user",
											},
										},
									},
									// Containerd logs format
									{
										name:
											"FLUENT_CONTAINER_TAIL_PARSER_TYPE",
										value:
											"/^(?<time>.+) (?<stream>stdout|stderr) (?<logtag>[FP]) (?<log>.+)$/",
									},
									{
										name:
											"FLUENT_CONTAINER_TAIL_EXCLUDE_PATH",
										value: `["/var/log/containers/fluentd-*"]`,
									},
								],
								resources: {
									limits: {
										memory: "200Mi",
									},
									requests: {
										cpu: "100m",
										memory: "200Mi",
									},
								},
								volumeMounts: [
									{
										name: "varlog",
										mountPath: "/var/log",
									},
									{
										name: "varlibdockercontainers",
										mountPath: "/var/lib/docker/containers",
										readOnly: true,
									},
									{
										name: "config",
										mountPath:
											"/fluentd/etc/kubernetes.conf",
										subPath: "kubernetes.conf",
									},
								],
							},
						],
						terminationGracePeriodSeconds: 30,
						volumes: [
							{
								name: "varlog",
								hostPath: {
									path: "/var/log",
								},
							},
							{
								name: "varlibdockercontainers",
								hostPath: {
									path: "/var/lib/docker/containers",
								},
							},
							{
								name: "config",
								configMap: {
									name: "fluentd-kubernetes-conf",
								},
							},
						],
					},
				},
			},
		});

		// --- InfluxDB setup ---

		new KubeNamespace(this, "influxdb-namespace", {
			metadata: {
				name: "influxdb",
				labels: {
					// "istio-injection": "enabled",
				},
			},
		});

		const influxdbSSLabels = {
			app: "influxdb",
		};

		new KubeStatefulSet(this, "influxdb-statefulset", {
			metadata: {
				name: "influxdb",
				namespace: "influxdb",
				labels: influxdbSSLabels,
			},
			spec: {
				replicas: 1,
				selector: {
					matchLabels: influxdbSSLabels,
				},
				serviceName: "influxdb",
				template: {
					metadata: {
						labels: influxdbSSLabels,
					},
					spec: {
						containers: [
							{
								image: "quay.io/influxdb/influxdb:2.0.0-beta",
								name: "influxdb",
								ports: [
									{
										containerPort: 9999,
										name: "influxdb",
									},
								],
								volumeMounts: [
									{
										mountPath: "/root/.influxdbv2",
										name: "influxdb-data",
									},
								],
								imagePullPolicy: "Always",
							},
						],
					},
				},
				volumeClaimTemplates: [
					{
						metadata: {
							name: "influxdb-data",
							namespace: "influxdb",
						},
						spec: {
							accessModes: ["ReadWriteOnce"],
							resources: {
								requests: {
									storage: "100Gi",
								},
							},
						},
					} as any,
				],
			},
		});

		new KubeService(this, "influxdb-service", {
			metadata: {
				name: "influxdb",
				namespace: "influxdb",
			},
			spec: {
				ports: [
					{
						name: "http-influxdb",
						port: 9999,
						targetPort: 9999,
					},
				],
				selector: influxdbSSLabels,
				type: "ClusterIP",
			},
		});

		// --- Ingress ---

		// TLS certificate requested via cert-manager
		new Certificate(this, "fortify-ssl-cert", {
			metadata: {
				name: "fortify-ssl-cert",
				namespace: "istio-system",
			},
			spec: {
				secretName: "fortify-ssl-cert",
				commonName: DOMAIN,
				dnsNames: [DOMAIN, `api.${DOMAIN}`, `gsi.${DOMAIN}`],
				issuerRef: {
					name: "cf-letsencrypt-staging",
					kind: "ClusterIssuer",
				},
			},
		});

		// TLS certificate requested via cert-manager
		new Certificate(this, "fortify-cluster-ssl-cert", {
			metadata: {
				name: "fortify-cluster-ssl-cert",
				namespace: "istio-system",
			},
			spec: {
				secretName: "fortify-cluster-ssl-cert",
				commonName: "fortify.dev",
				dnsNames: devHosts,
				issuerRef: {
					name: "cf-letsencrypt-staging",
					kind: "ClusterIssuer",
				},
			},
		});

		// Istio gateway
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
						hosts,
					},
					{
						port: {
							number: 443,
							name: "https-dev",
							protocol: "HTTPS",
						},
						tls: {
							mode: GatewaySpecServersTlsMode.SIMPLE,
							credentialName: "fortify-cluster-ssl-cert",
						},
						hosts: devHosts,
					},
				],
			},
		} as CustomGatewayOptions);

		new VirtualService(this, "nginx-ingress-virtual-service", {
			spec: {
				hosts: devHosts,
				gateways: ["fortify-gateway"],
				http: [
					{
						route: [
							{
								destination: {
									host:
										"ingress-nginx-controller.ingress-nginx.svc.cluster.local",
									port: {
										number: 80,
									},
								},
							},
						],
					},
				],
			},
		} as VirtualServiceOptions & { metadata: ObjectMeta });

		new ClusterIngress(this, "akhq-ingress", {
			name: "akhq",
			namespace: "fortify",
			serviceName: "akhq",
			servicePort: 80,
		});

		new ClusterIngress(this, "redis-commander-ingress", {
			name: "redis-commander",
			namespace: "fortify",
			serviceName: "redis-commander",
			servicePort: 80,
		});

		new ClusterIngress(this, "influxdb-ingress", {
			name: "influxdb",
			namespace: "influxdb",
			serviceName: "influxdb",
			servicePort: 9999,

			// Let's disable it for now. Basic auth is very annoying with influx
			basicAuth: false,
		});

		new ClusterIngress(this, "kibana-ingress", {
			name: "kibana",
			namespace: "logs",
			serviceName: "kibana-kb-http",
			servicePort: 5601,

			basicAuth: false,
		});

		// Placeholder until the staging cluster arrives
		new ClusterIngress(this, "frontend-ingress", {
			name: "frontend",
			namespace: "fortify",
			serviceName: "frontend",
			servicePort: 3000,

			host: "fortify.dev",
		});
	}
}
