import { Chart } from "cdk8s";
import { Construct } from "constructs";
import {
	KubeNamespace,
	KubeSecret,
	KubeServiceAccount,
	KubeClusterRole,
	KubeClusterRoleBinding,
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
	ENVIRONMENT = "prod",
	CLUSTER_BASIC_AUTH = "",
} = process.env;

const hosts = [DOMAIN, `api.${DOMAIN}`, `gsi.${DOMAIN}`];

const devHosts = [
	`akhq-${ENVIRONMENT}.fortify.dev`,
	`redis-commander-${ENVIRONMENT}.fortify.dev`,
	`influxdb-rc-${ENVIRONMENT}.fortify.dev`,
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

		const fortifyNS = new KubeNamespace(this, "fortify-namespace", {
			metadata: {
				name: "fortify",
			},
		});

		// --- Kafka setup ---

		const kafkaNS = new KubeNamespace(this, "kafka-namespace", {
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
																"strimzi.io/name",
															operator: "In",
															values: [
																"fortify-kafka",
															],
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
																"strimzi.io/name",
															operator: "In",
															values: [
																"fortify-zookeeper",
															],
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

		const postgresNS = new KubeNamespace(this, "postgres-namespace", {
			metadata: {
				name: "postgres",
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

		const redisNS = new KubeNamespace(this, "redis-namespace", {
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

		const logsNS = new KubeNamespace(this, "logs-namespace", {
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

		const fluentdSA = new KubeServiceAccount(
			this,
			"fluentd-service-account",
			{
				metadata: {
					name: "fluentd",
					namespace: logsNS.name,
				},
			}
		);

		new KubeClusterRole(this, "fluentd-cluster-role", {
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
					namespace: logsNS.name,
				},
			],
		});

		const fluentDsLabels = {
			"k8s-app": "fluentd-logging",
			version: "v1",
		};

		new KubeDaemonSet(this, "fluentd-ds", {
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

		const influxNS = new KubeNamespace(this, "influxdb-namespace", {
			metadata: {
				name: "influxdb",
			},
		});

		// Influxdb RC1
		const influxdbLabels = {
			app: "influxdb-rc",
		};

		const influxdbSS = new KubeStatefulSet(
			this,
			"influxdb-rc-statefulset",
			{
				metadata: {
					name: "influxdb-rc",
					namespace: influxNS.name,
					labels: influxdbLabels,
				},
				spec: {
					replicas: 1,
					selector: {
						matchLabels: influxdbLabels,
					},
					serviceName: "influxdb-rc",
					template: {
						metadata: {
							labels: influxdbLabels,
						},
						spec: {
							containers: [
								{
									image: "quay.io/influxdb/influxdb:2.0.2",
									name: "influxdb",
									ports: [
										{
											containerPort: 8086,
											name: "influxdb",
										},
									],
									volumeMounts: [
										{
											mountPath: "/root/.influxdbv2",
											name: "influxdb-rc-data",
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
								name: "influxdb-rc-data",
								namespace: "influxdb",
							},
							spec: {
								accessModes: ["ReadWriteOnce"],
								resources: {
									requests: {
										storage: "2Gi",
									},
								},
							},
						} as any,
					],
				},
			}
		);

		new KubeService(this, "influxdb-service", {
			metadata: {
				name: influxdbSS.name,
				namespace: influxNS.name,
			},
			spec: {
				ports: [
					{
						name: "http-influxdb",
						port: 8086,
						targetPort: 8086,
					},
				],
				selector: influxdbLabels,
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

		const basicAuthSecret = new KubeSecret(this, "basic-auth-secret", {
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

		new Middleware(this, "compression", {
			metadata: {
				name: "compression",
				namespace: "kube-system",
			},
			spec: {
				compress: {},
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

		new ClusterIngressTraefik(this, "influxdb-rc-ingress", {
			name: "influxdb-rc",
			namespace: influxNS.name,
			serviceName: "influxdb-rc",
			servicePort: 8086,

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
