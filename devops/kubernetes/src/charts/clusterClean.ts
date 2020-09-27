import { Chart } from "cdk8s";
import { Construct } from "constructs";
import {
	Namespace,
	Secret,
	ServiceAccount,
	ClusterRole,
	ClusterRoleBinding,
	DaemonSet,
	StatefulSet,
	Service,
	ObjectMeta,
} from "../../imports/k8s";
import {
	Kafka,
	KafkaSpecKafkaStorageType,
	KafkaSpecKafkaStorageVolumesType,
	KafkaSpecZookeeperStorageType,
	KafkaOptions,
	// KafkaSpecKafkaListenersTlsAuthenticationType,
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
import { Certificate } from "../../imports/cert-manager.io/certificate";
import { ClusterIngressTraefik } from "../cluster/ingressTraefik";
import { Middleware } from "../../imports/traefik.containo.us/middleware";

const {
	DOMAIN = "fortify.gg",
	POSTGRES_PASSWORD = "",
	ENVIRONMENT = "prod",
	CLUSTER_BASIC_AUTH = "",
} = process.env;

const hosts = [DOMAIN, `api.${DOMAIN}`, `gsi.${DOMAIN}`];

const devHosts = [
	`akhq-${ENVIRONMENT}.fortify.dev`,
	`redis-commander-${ENVIRONMENT}.fortify.dev`,
	`influxdb-${ENVIRONMENT}.fortify.dev`,
	`kibana-${ENVIRONMENT}.fortify.dev`,
	`fortify.dev`,
];

export interface CustomKafkaOptions extends KafkaOptions {
	metadata?: ObjectMeta;
}

export interface CustomKafkaTopicOptions extends KafkaTopicOptions {
	metadata?: ObjectMeta;
}

export class ClusterSetupClean extends Chart {
	constructor(scope: Construct, name: string) {
		super(scope, name);

		const fortifyNS = new Namespace(this, "fortify-namespace", {
			metadata: {
				name: "fortify",
			},
		});

		// --- Kafka setup ---

		const kafkaNS = new Namespace(this, "kafka-namespace", {
			metadata: {
				name: "kafka",
			},
		});

		const kafka = new Kafka(this, "kafka", {
			metadata: {
				name: "fortify",
				namespace: kafkaNS.name,
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
								size: "20Gi",
								deleteClaim: false,
							},
						],
					},
					template: {
						pod: {
							affinity: {
								podAntiAffinity: {
									preferredDuringSchedulingIgnoredDuringExecution: [
										{
											weight: 1,
											podAffinityTerm: {
												labelSelector: {
													matchExpressions: [
														{
															key:
																"strimzi.io/cluster",
															operator: "In",
															values: ["fortify"],
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
				zookeeper: {
					replicas: 3,
					storage: {
						type: KafkaSpecZookeeperStorageType.PERSISTENT_CLAIM,
						size: "10Gi",
						deleteClaim: false,
					},
					template: {
						pod: {
							affinity: {
								podAntiAffinity: {
									preferredDuringSchedulingIgnoredDuringExecution: [
										{
											weight: 1,
											podAffinityTerm: {
												labelSelector: {
													matchExpressions: [
														{
															key:
																"strimzi.io/cluster",
															operator: "In",
															values: ["fortify"],
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
				entityOperator: {
					topicOperator: {},
				},
			},
		} as CustomKafkaOptions);

		new KafkaTopic(this, "gsi-topic", {
			metadata: {
				name: "gsi",
				namespace: kafkaNS.name,
				labels: {
					"strimzi.io/cluster": kafka.name,
				},
			},
			spec: {
				partitions: 3,
				replicas: 3,
				config: {
					"retention.ms": 1 * 24 * 60 * 60 * 1000, // 1 * 1 day,
					"segment.ms": 1 * 60 * 60 * 1000, // 1 hour
					"segment.bytes": 1073741824, // 1 GB
				},
			},
		} as CustomKafkaTopicOptions);

		new KafkaTopic(this, "game-events-topic", {
			metadata: {
				name: "game-events",
				namespace: kafkaNS.name,
				labels: {
					"strimzi.io/cluster": kafka.name,
				},
			},
			spec: {
				partitions: 3,
				replicas: 3,
				config: {
					"retention.ms": 7 * 24 * 60 * 60 * 1000, // 7 * 1 day,
					"segment.ms": 24 * 60 * 60 * 1000, // 1 day
					"segment.bytes": 1073741824, // 1 GB
				},
			},
		} as CustomKafkaTopicOptions);

		new KafkaTopic(this, "system-events-topic", {
			metadata: {
				name: "system-events",
				namespace: kafkaNS.name,
				labels: {
					"strimzi.io/cluster": kafka.name,
				},
			},
			spec: {
				partitions: 3,
				replicas: 3,
				config: {
					"retention.ms": 7 * 24 * 60 * 60 * 1000, // 7 * 1 day,
					"segment.ms": 24 * 60 * 60 * 1000, // 1 day
					"segment.bytes": 1073741824, // 1 GB
				},
			},
		} as CustomKafkaTopicOptions);

		// --- Postgres setup ---

		const postgresNS = new Namespace(this, "postgres-namespace", {
			metadata: {
				name: "postgres",
			},
		});

		new Secret(this, "postgres-auth", {
			metadata: {
				name: "postgres-auth",
				namespace: postgresNS.name,
			},
			stringData: {
				POSTGRES_USER: "postgres",
				POSTGRES_PASSWORD,
			},
		});

		new Postgres(this, "postgres", {
			metadata: {
				name: "postgres",
				namespace: postgresNS.name,
			},
			spec: {
				version: "11.2",
				replicas: 3,
				storageType: "Durable",
				storage: {
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

		const redisNS = new Namespace(this, "redis-namespace", {
			metadata: {
				name: "redis",
			},
		});

		new RedisFailover(this, "redis", {
			metadata: {
				name: "redis",
				namespace: redisNS.name,
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
			namespace: "fortify",

			SENTINEL_HOST: "rfs-redis.redis",
			SENTINEL_PORT: "26379",
		});

		// --- Logs ---

		const logsNS = new Namespace(this, "logs-namespace", {
			metadata: {
				name: "logs",
			},
		});

		// --- ElasticSearch setup ---

		new Elasticsearch(this, "elasticsearch", {
			metadata: {
				name: "elasticsearch",
				namespace: logsNS.name,
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
											storage: "20Gi",
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
				namespace: logsNS.name,
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

		const fluentdSA = new ServiceAccount(this, "fluentd-service-account", {
			metadata: {
				name: "fluentd",
				namespace: logsNS.name,
			},
		});

		new ClusterRole(this, "fluentd-cluster-role", {
			metadata: {
				name: "fluentd",
				namespace: logsNS.name,
			},
			rules: [
				{
					apiGroups: [""],
					resources: ["pods", "namespaces"],
					verbs: ["get", "list", "watch"],
				},
			],
		});

		new ClusterRoleBinding(this, "fluentd-cluster-role-binding", {
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
					namespace: logsNS.name,
				},
			],
		});

		const fluentDsLabels = {
			"k8s-app": "fluentd-logging",
			version: "v1",
		};

		new DaemonSet(this, "fluentd-ds", {
			metadata: {
				name: "fluentd",
				namespace: logsNS.name,
				labels: fluentDsLabels,
			},
			spec: {
				selector: {
					matchLabels: fluentDsLabels,
				},
				template: {
					metadata: {
						labels: fluentDsLabels,
					},
					spec: {
						serviceAccount: fluentdSA.name,
						serviceAccountName: fluentdSA.name,
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
						],
					},
				},
			},
		});

		// --- InfluxDB setup ---

		const influxNS = new Namespace(this, "influxdb-namespace", {
			metadata: {
				name: "influxdb",
			},
		});

		const influxdbSSLabels = {
			app: "influxdb",
		};

		new StatefulSet(this, "influxdb-statefulset", {
			metadata: {
				name: "influxdb",
				namespace: influxNS.name,
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
									storage: "10Gi",
								},
							},
						},
					} as any,
				],
			},
		});

		new Service(this, "influxdb-service", {
			metadata: {
				name: "influxdb",
				namespace: influxNS.name,
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
				namespace: "kube-system",
			},
			spec: {
				secretName: "fortify-ssl-cert",
				commonName: DOMAIN,
				dnsNames: hosts,
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
				namespace: "kube-system",
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

		const basicAuthSecret = new Secret(this, "basic-auth-secret", {
			type: "Opaque",
			metadata: {
				name: "basic-auth",
				namespace: "kube-system",
			},
			stringData: {
				auth: CLUSTER_BASIC_AUTH,
			},
		});

		new Middleware(this, "basic-auth-middleware", {
			metadata: {
				name: "basic-auth",
				namespace: "kube-system",
			},
			spec: {
				basicAuth: {
					secret: basicAuthSecret.name,
				},
			},
		});

		new Middleware(this, "redirect-scheme-middleware", {
			metadata: {
				name: "redirect-scheme-middleware",
				namespace: "kube-system",
			},
			spec: {
				redirectScheme: {
					scheme: "https",
					permanent: true,
				},
			},
		});

		new ClusterIngressTraefik(this, "akhq-ingress", {
			name: "akhq",
			namespace: fortifyNS.name,
			serviceName: "akhq",
			servicePort: 80,
		});

		new ClusterIngressTraefik(this, "redis-commander-ingress", {
			name: "redis-commander",
			namespace: fortifyNS.name,
			serviceName: "redis-commander",
			servicePort: 80,
		});

		new ClusterIngressTraefik(this, "influxdb-ingress", {
			name: "influxdb",
			namespace: influxNS.name,
			serviceName: "influxdb",
			servicePort: 9999,

			// Let's disable it for now. Basic auth is very annoying with influx
			basicAuth: false,
		});

		new ClusterIngressTraefik(this, "kibana-ingress", {
			name: "kibana",
			namespace: logsNS.name,
			serviceName: "kibana-kb-http",
			servicePort: 5601,

			basicAuth: false,
		});

		// Placeholder until the staging cluster arrives
		new ClusterIngressTraefik(this, "frontend-dev-ingress", {
			name: "frontend",
			namespace: fortifyNS.name,
			serviceName: "frontend",
			servicePort: 3000,

			host: "fortify.dev",
		});
	}
}
