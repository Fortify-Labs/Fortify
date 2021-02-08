import { Chart } from "cdk8s";
import { Construct } from "constructs";
import {
	KubeNamespace,
	KubeSecret,
	KubeStatefulSet,
	KubeService,
	ObjectMeta,
	KubeConfigMap,
} from "../imports/k8s";
import { RedisCommander } from "./constructs/redis-commander/redis-commander";
import { ClusterIngressTraefik } from "./constructs/fortify/ingressTraefik";
import { FluentdConstruct } from "./constructs/fluentd/fluentd";
import {
	Kafka,
	KafkaProps,
	KafkaSpecKafkaMetricsConfigType,
	KafkaSpecKafkaStorageType,
	KafkaSpecKafkaStorageVolumesType,
	KafkaSpecZookeeperMetricsConfigType,
	KafkaSpecZookeeperStorageType,
	KafkaTopic,
	KafkaTopicProps,
} from "../imports/kafka.strimzi.io";
import { Postgres } from "../imports/kubedb.com";
import { RedisFailover } from "../imports/databases.spotahome.com";
import { Elasticsearch } from "../imports/elasticsearch.k8s.elastic.co";
import { Kibana } from "../imports/kibana.k8s.elastic.co";
import { Certificate } from "../imports/cert-manager.io";
import { Middleware } from "../imports/traefik.containo.us";
import { stripIndent } from "common-tags";

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
	`grafana.fortify.dev`,
];

export interface CustomKafkaProps extends KafkaProps {
	metadata?: ObjectMeta;
}

export interface CustomKafkaTopicProps extends KafkaTopicProps {
	metadata?: ObjectMeta;
}

export class ClusterSetup extends Chart {
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

		const kafkaMetricsCM = new KubeConfigMap(this, "kafka-metrics-cm", {
			metadata: {
				name: "kafka-metrics",
				namespace: kafkaNS.name,
			},
			data: {
				// See https://github.com/prometheus/jmx_exporter for more info about JMX Prometheus Exporter metrics
				"kafka-metrics-config.yml": stripIndent(String.raw`
                lowercaseOutputName: true
                rules: 
                # Special cases and very specific rules
                - pattern: kafka.server<type=(.+), name=(.+), clientId=(.+), topic=(.+), partition=(.*)><>Value
                  name: kafka_server_$1_$2
                  type: GAUGE
                  labels:
                   clientId: "$3"
                   topic: "$4"
                   partition: "$5"
                - pattern: kafka.server<type=(.+), name=(.+), clientId=(.+), brokerHost=(.+), brokerPort=(.+)><>Value
                  name: kafka_server_$1_$2
                  type: GAUGE
                  labels:
                   clientId: "$3"
                   broker: "$4:$5"
                - pattern: kafka.server<type=(.+), cipher=(.+), protocol=(.+), listener=(.+), networkProcessor=(.+)><>connections
                  name: kafka_server_$1_connections_tls_info
                  type: GAUGE
                  labels:
                    listener: "$2"
                    networkProcessor: "$3"
                    protocol: "$4"
                    cipher: "$5"
                - pattern: kafka.server<type=(.+), clientSoftwareName=(.+), clientSoftwareVersion=(.+), listener=(.+), networkProcessor=(.+)><>connections
                  name: kafka_server_$1_connections_software
                  type: GAUGE
                  labels:
                    clientSoftwareName: "$2"
                    clientSoftwareVersion: "$3"
                    listener: "$4"
                    networkProcessor: "$5"
                - pattern: "kafka.server<type=(.+), listener=(.+), networkProcessor=(.+)><>(.+):"
                  name: kafka_server_$1_$4
                  type: GAUGE
                  labels:
                   listener: "$2"
                   networkProcessor: "$3"
                - pattern: kafka.server<type=(.+), listener=(.+), networkProcessor=(.+)><>(.+)
                  name: kafka_server_$1_$4
                  type: GAUGE
                  labels:
                   listener: "$2"
                   networkProcessor: "$3"
                # Some percent metrics use MeanRate attribute
                # Ex) kafka.server<type=(KafkaRequestHandlerPool), name=(RequestHandlerAvgIdlePercent)><>MeanRate
                - pattern: kafka.(\w+)<type=(.+), name=(.+)Percent\w*><>MeanRate
                  name: kafka_$1_$2_$3_percent
                  type: GAUGE
                # Generic gauges for percents
                - pattern: kafka.(\w+)<type=(.+), name=(.+)Percent\w*><>Value
                  name: kafka_$1_$2_$3_percent
                  type: GAUGE
                - pattern: kafka.(\w+)<type=(.+), name=(.+)Percent\w*, (.+)=(.+)><>Value
                  name: kafka_$1_$2_$3_percent
                  type: GAUGE
                  labels:
                    "$4": "$5"
                # Generic per-second counters with 0-2 key/value pairs
                - pattern: kafka.(\w+)<type=(.+), name=(.+)PerSec\w*, (.+)=(.+), (.+)=(.+)><>Count
                  name: kafka_$1_$2_$3_total
                  type: COUNTER
                  labels:
                    "$4": "$5"
                    "$6": "$7"
                - pattern: kafka.(\w+)<type=(.+), name=(.+)PerSec\w*, (.+)=(.+)><>Count
                  name: kafka_$1_$2_$3_total
                  type: COUNTER
                  labels:
                    "$4": "$5"
                - pattern: kafka.(\w+)<type=(.+), name=(.+)PerSec\w*><>Count
                  name: kafka_$1_$2_$3_total
                  type: COUNTER
                # Generic gauges with 0-2 key/value pairs
                - pattern: kafka.(\w+)<type=(.+), name=(.+), (.+)=(.+), (.+)=(.+)><>Value
                  name: kafka_$1_$2_$3
                  type: GAUGE
                  labels:
                    "$4": "$5"
                    "$6": "$7"
                - pattern: kafka.(\w+)<type=(.+), name=(.+), (.+)=(.+)><>Value
                  name: kafka_$1_$2_$3
                  type: GAUGE
                  labels:
                    "$4": "$5"
                - pattern: kafka.(\w+)<type=(.+), name=(.+)><>Value
                  name: kafka_$1_$2_$3
                  type: GAUGE
                # Emulate Prometheus 'Summary' metrics for the exported 'Histogram's.
                # Note that these are missing the '_sum' metric!
                - pattern: kafka.(\w+)<type=(.+), name=(.+), (.+)=(.+), (.+)=(.+)><>Count
                  name: kafka_$1_$2_$3_count
                  type: COUNTER
                  labels:
                    "$4": "$5"
                    "$6": "$7"
                - pattern: kafka.(\w+)<type=(.+), name=(.+), (.+)=(.*), (.+)=(.+)><>(\d+)thPercentile
                  name: kafka_$1_$2_$3
                  type: GAUGE
                  labels:
                    "$4": "$5"
                    "$6": "$7"
                    quantile: "0.$8"
                - pattern: kafka.(\w+)<type=(.+), name=(.+), (.+)=(.+)><>Count
                  name: kafka_$1_$2_$3_count
                  type: COUNTER
                  labels:
                    "$4": "$5"
                - pattern: kafka.(\w+)<type=(.+), name=(.+), (.+)=(.*)><>(\d+)thPercentile
                  name: kafka_$1_$2_$3
                  type: GAUGE
                  labels:
                    "$4": "$5"
                    quantile: "0.$6"
                - pattern: kafka.(\w+)<type=(.+), name=(.+)><>Count
                  name: kafka_$1_$2_$3_count
                  type: COUNTER
                - pattern: kafka.(\w+)<type=(.+), name=(.+)><>(\d+)thPercentile
                  name: kafka_$1_$2_$3
                  type: GAUGE
                  labels:
                    quantile: "0.$4"
                `),
				// See https://github.com/prometheus/jmx_exporter for more info about JMX Prometheus Exporter metrics
				"zookeeper-metrics-config.yml": stripIndent(String.raw`
                lowercaseOutputName: true
                rules:
                # replicated Zookeeper
                - pattern: "org.apache.ZooKeeperService<name0=ReplicatedServer_id(\\d+)><>(\\w+)"
                  name: "zookeeper_$2"
                  type: GAUGE
                - pattern: "org.apache.ZooKeeperService<name0=ReplicatedServer_id(\\d+), name1=replica.(\\d+)><>(\\w+)"
                  name: "zookeeper_$3"
                  type: GAUGE
                  labels:
                    replicaId: "$2"
                - pattern: "org.apache.ZooKeeperService<name0=ReplicatedServer_id(\\d+), name1=replica.(\\d+), name2=(\\w+)><>(Packets\\w+)"
                  name: "zookeeper_$4"
                  type: COUNTER
                  labels:
                    replicaId: "$2"
                    memberType: "$3"
                - pattern: "org.apache.ZooKeeperService<name0=ReplicatedServer_id(\\d+), name1=replica.(\\d+), name2=(\\w+)><>(\\w+)"
                  name: "zookeeper_$4"
                  type: GAUGE
                  labels:
                    replicaId: "$2"
                    memberType: "$3"
                - pattern: "org.apache.ZooKeeperService<name0=ReplicatedServer_id(\\d+), name1=replica.(\\d+), name2=(\\w+), name3=(\\w+)><>(\\w+)"
                  name: "zookeeper_$4_$5"
                  type: GAUGE
                  labels:
                    replicaId: "$2"
                    memberType: "$3"
                `),
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
					listeners: [
						{
							name: "plain",
							port: 9092,
							type: "internal",
							tls: false,
						},
						{
							name: "tls",
							port: 9093,
							type: "internal",
							tls: true,
						},
					],
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
					metricsConfig: {
						type:
							KafkaSpecKafkaMetricsConfigType.JMX_PROMETHEUS_EXPORTER,
						valueFrom: {
							configMapKeyRef: {
								name: kafkaMetricsCM.name,
								key: "kafka-metrics-config.yml",
							},
						},
					},
					template: {
						pod: {
							metadata: {
								annotations: {
									"prometheus.io/scrape": "true",
									"prometheus.io/port": 9404,
									"prometheus.io/path": "/",
								},
							},
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
					metricsConfig: {
						type:
							KafkaSpecZookeeperMetricsConfigType.JMX_PROMETHEUS_EXPORTER,
						valueFrom: {
							configMapKeyRef: {
								name: kafkaMetricsCM.name,
								key: "zookeeper-metrics-config.yml",
							},
						},
					},
					template: {
						pod: {
							metadata: {
								annotations: {
									"prometheus.io/scrape": "true",
									"prometheus.io/port": 9404,
									"prometheus.io/path": "/",
								},
							},
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
				kafkaExporter: {
					template: {
						pod: {
							metadata: {
								annotations: {
									"prometheus.io/scrape": "true",
									"prometheus.io/port": 9404,
									"prometheus.io/path": "/metrics",
								},
							},
						},
					},
					topicRegex: ".*",
					groupRegex: ".*",
				},
			},
		} as CustomKafkaProps);

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
		} as CustomKafkaTopicProps);

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
					"retention.ms": 1 * 24 * 60 * 60 * 1000, // 1 * 1 day,
					"segment.ms": 1 * 60 * 60 * 1000, // 1 hour
					"segment.bytes": 1073741824, // 1 GB
				},
			},
		} as CustomKafkaTopicProps);

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
		} as CustomKafkaTopicProps);

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

		new FluentdConstruct(this, "fluentd");

		// --- InfluxDB setup ---

		const influxNS = new KubeNamespace(this, "influxdb-namespace", {
			metadata: {
				name: "influxdb",
			},
		});

		// Influxdb
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
									image: "quay.io/influxdb/influxdb:v2.0.3",
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
					name: "cf-letsencrypt",
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
					name: "cf-letsencrypt",
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
