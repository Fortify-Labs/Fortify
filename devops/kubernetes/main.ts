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
import {
	Secret,
	ObjectMeta,
	Namespace,
	ConfigMap,
	ServiceAccount,
	ClusterRole,
	ClusterRoleBinding,
	DaemonSet,
	StatefulSet,
	Service,
} from "./imports/k8s";
import {
	Kafka,
	KafkaSpecKafkaStorageType,
	KafkaSpecKafkaStorageVolumesType,
	KafkaSpecZookeeperStorageType,
	KafkaOptions,
} from "./imports/kafka.strimzi.io/kafka";
import { Postgres } from "./imports/kubedb.com/postgres";
import { RedisCommander } from "./src/redis-commander";

import backendPackage from "../../services/backend/package.json";
import frontendPackage from "../../services/frontend/package.json";
import fsmPackage from "../../services/fsm/package.json";
import gsiReceiverPackage from "../../services/gsi-receiver/package.json";
import twitchBotPackage from "../../services/17kmmrbot/package.json";
import jobsPackage from "../../services/jobs/package.json";
import historizationPackage from "../../services/historization/package.json";
import {
	KafkaTopic,
	KafkaTopicOptions,
} from "./imports/kafka.strimzi.io/kafkatopic";
import { FortifyCronJob } from "./src/cronjob";
import { RedisFailover } from "./imports/databases.spotahome.com/redisfailover";
import { Elasticsearch } from "./imports/elasticsearch.k8s.elastic.co/elasticsearch";
import { Kibana } from "./imports/kibana.k8s.elastic.co/kibana";
import { kubernetesConf } from "./src/fluentd/config";
import {
	VirtualService,
	VirtualServiceOptions,
} from "./imports/networking.istio.io/virtualservice";
import { ClusterIngress } from "./src/cluster/ingress";

export interface CustomGatewayOptions extends GatewayOptions {
	metadata?: ObjectMeta;
}

export interface CustomKafkaOptions extends KafkaOptions {
	metadata?: ObjectMeta;
}

export interface CustomKafkaTopicOptions extends KafkaTopicOptions {
	metadata?: ObjectMeta;
}

const {
	JWT_SECRET,
	OAUTH_TOKEN,
	DOMAIN = "fortify.gg",
	POSTGRES_PASSWORD = "",
	INFLUXDB_TOKEN = "",
	STEAM_WEB_API_KEY = "",
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

export class ClusterSetup extends Chart {
	constructor(scope: Construct, name: string) {
		super(scope, name, { namespace: "fortify" });

		new Namespace(this, "fortify-namespace", {
			metadata: {
				name: "fortify",
				namespace: undefined,
				labels: {
					"istio-injection": "enabled",
				},
			},
		});

		// --- Kafka setup ---

		new Namespace(this, "kafka-namespace", {
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
				partitions: 1,
				replicas: 1,
				config: {
					"retention.ms": 7 * 86400000, // 7 * 1 day,
					"segment.ms": 86400000, // 1 day
					"segment.bytes": 1073741824, // 1 GB
				},
			},
		} as CustomKafkaTopicOptions);

		// --- Postgres setup ---

		new Namespace(this, "postgres-namespace", {
			metadata: {
				name: "postgres",
				namespace: undefined,
				labels: {
					// "istio-injection": "enabled",
				},
			},
		});

		new Secret(this, "postgres-auth", {
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
			},
		});

		// --- Redis setup ---

		new Namespace(this, "redis-namespace", {
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

		new Namespace(this, "logs-namespace", {
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

		new ServiceAccount(this, "fluentd-service-account", {
			metadata: {
				name: "fluentd",
				namespace: "logs",
			},
		});

		new ClusterRole(this, "fluentd-cluster-role", {
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
					namespace: "logs",
				},
			],
		});

		new ConfigMap(this, "fluentd-config", {
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

		new DaemonSet(this, "fluentd-ds", {
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

		new Namespace(this, "influxdb-namespace", {
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

		new StatefulSet(this, "influxdb-statefulset", {
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

		new Service(this, "influxdb-service", {
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

export class Fortify extends Chart {
	constructor(scope: Construct, name: string) {
		super(scope, name, { namespace: "fortify" });

		// define resources here

		// TODO: Move this to vault, once vault is setup
		new Secret(this, "jwt-secret", {
			metadata: {
				name: "jwt-secret",
			},
			stringData: {
				JWT_SECRET: JWT_SECRET ?? "",
			},
		});

		new Secret(this, "twitch-bot-secret", {
			metadata: {
				name: "twitch-bot-secret",
			},
			stringData: {
				OAUTH_TOKEN: OAUTH_TOKEN ?? "",
			},
		});

		// Default env variables
		new ConfigMap(this, "kafka-config", {
			metadata: {
				name: "kafka-config",
			},
			data: {
				KAFKA_BROKERS: '["fortify-kafka-bootstrap.kafka:9092"]',
			},
		});

		new ConfigMap(this, "postgres-config", {
			metadata: {
				name: "postgres-config",
			},
			data: {
				POSTGRES_HOST: "postgres.postgres",
				POSTGRES_PORT: "5432",
				POSTGRES_DATABASE: "postgres",
			},
		});

		new Secret(this, "postgres-auth", {
			metadata: {
				name: "postgres-auth",
			},
			stringData: {
				POSTGRES_USER: "postgres",
				POSTGRES_PASSWORD,
			},
		});

		new ConfigMap(this, "redis-config", {
			metadata: {
				name: "redis-config",
			},
			data: {
				// REDIS_URL: "redis://redis.redis:6379",
				REDIS_SENTINEL: "rfs-redis.redis:26379",
				REDIS_SENTINEL_NAME: "mymaster",
			},
		});

		new ConfigMap(this, "influxdb-config", {
			metadata: {
				name: "influxdb-config",
			},
			data: {
				INFLUXDB_ORG: "Fortify",
				INFLUXDB_BUCKET: "mmr",
				INFLUXDB_URL: "http://influxdb.influxdb:9999",
			},
		});

		new Secret(this, "influxdb-secret", {
			metadata: {
				name: "influxdb-secret",
			},
			stringData: {
				INFLUXDB_TOKEN,
			},
		});

		new Secret(this, "steam-web-api-secret", {
			metadata: {
				name: "steam-web-api-secret",
			},
			stringData: {
				STEAM_WEB_API_KEY,
			},
		});

		// Fortify web services
		new WebService(this, "backend", {
			name: "backend",
			version: backendPackage.version,
			service: {
				name: "backend",
				containerPort: 8080,
				port: 8080,
				portName: "http-backend",
			},
			env: [
				{ name: "MY_PORT", value: "8080" },
				{ name: "NODE_ENV", value: "production" },
				{ name: "APP_URL", value: `https://api.${DOMAIN}` },
				{ name: "APP_DOMAIN", value: DOMAIN },
				{
					name: "APP_SUCCESSFUL_AUTH_RETURN_URL",
					value: `https://${DOMAIN}`,
				},
				{
					name: "APP_STEAM_RETURN_URL",
					value: `https://api.${DOMAIN}/auth/steam/return`,
				},
			],
			secrets: [
				"postgres-auth",
				"jwt-secret",
				"influxdb-secret",
				"steam-web-api-secret",
			],
			configmaps: [
				"postgres-config",
				"kafka-config",
				"redis-config",
				"influxdb-config",
			],
			gateways: ["fortify-gateway"],
			hosts: [`api.${DOMAIN}`],
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
			version: frontendPackage.version,
			env: [
				{
					name: "NEXT_PUBLIC_GRAPHQL_URI",
					value: `https://backend:8080/graphql`,
				},
				{
					name: "NEXT_PUBLIC_GRAPHQL_WS_URI",
					value: `wss://backend:8080/graphql`,
				},
				{
					name: "NEXT_PUBLIC_LOGIN_URL",
					value: `https://api.${DOMAIN}/auth/steam`,
				},
				{
					name: "NEXT_PUBLIC_URL",
					value: `https://${DOMAIN}`,
				},
			],
			service: {
				name: "frontend",
				containerPort: 3000,
				port: 3000,
				portName: "http-frontend",
			},
			gateways: ["fortify-gateway"],
			hosts: [DOMAIN],
			http: [
				{
					route: [
						{
							destination: {
								port: {
									number: 3000,
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
			version: gsiReceiverPackage.version,
			env: [
				{ name: "MY_PORT", value: "8080" },
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
				{ name: "KAFKA_TOPIC", value: "gsi" },
			],
			secrets: ["jwt-secret"],
			configmaps: ["kafka-config", "redis-config"],
			service: {
				name: "gsi-receiver",
				containerPort: 8080,
				port: 8080,
				portName: "http-gsi-ingress",
			},
			gateways: ["fortify-gateway"],
			hosts: [`gsi.${DOMAIN}`],
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

		// Deployments that are not exposed to the web
		new FortifyDeployment(this, "17kmmrbot", {
			name: "17kmmrbot",
			version: twitchBotPackage.version,
			env: [
				{ name: "BOT_USERNAME", value: "17kmmrbot" },
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
				{ name: "KAFKA_TOPIC", value: "gsi" },
				{ name: "BOT_BROADCAST_DISABLED", value: "false" },
			],
			secrets: ["postgres-auth", "twitch-bot-secret"],
			configmaps: ["postgres-config", "redis-config", "kafka-config"],
		});

		new FortifyDeployment(this, "fsm", {
			name: "fsm",
			version: fsmPackage.version,
			replicas: 3,
			env: [
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
			],
			secrets: ["jwt-secret", "postgres-auth"],
			configmaps: ["redis-config", "kafka-config", "postgres-config"],
		});

		new FortifyDeployment(this, "historization", {
			name: "historization",
			version: historizationPackage.version,
			replicas: 3,
			env: [
				{
					name: "SERVICE_NAME",
					value: "historization",
				},
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
			],
			configmaps: [
				"redis-config",
				"kafka-config",
				"influxdb-config",
				"postgres-config",
			],
			secrets: [
				"influxdb-secret",
				"postgres-auth",
				"steam-web-api-secret",
			],
		});

		// CronJobs
		new FortifyCronJob(this, "import-standard", {
			name: "import-standard",
			version: jobsPackage.version,

			schedule: "14 * * * *",
			script: "import",

			env: [
				{
					name: "LEADERBOARD_TYPE",
					value: "standard",
				},
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
			],
			secrets: ["postgres-auth"],
			configmaps: ["redis-config", "kafka-config", "postgres-config"],
		});
		new FortifyCronJob(this, "import-turbo", {
			name: "import-turbo",
			version: jobsPackage.version,

			schedule: "14 * * * *",
			script: "import",

			env: [
				{
					name: "LEADERBOARD_TYPE",
					value: "turbo",
				},
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
			],
			secrets: ["postgres-auth"],
			configmaps: ["redis-config", "kafka-config", "postgres-config"],
		});
		new FortifyCronJob(this, "import-duos", {
			name: "import-duos",
			version: jobsPackage.version,

			schedule: "14 * * * *",
			script: "import",

			env: [
				{
					name: "LEADERBOARD_TYPE",
					value: "duos",
				},
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
			],
			secrets: ["postgres-auth"],
			configmaps: ["redis-config", "kafka-config", "postgres-config"],
		});
		new FortifyCronJob(this, "db-cleanup", {
			name: "db-cleanup",
			version: jobsPackage.version,

			// Every hour
			schedule: "0 * * * *",
			script: "clean_db",

			env: [
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
			],
			secrets: ["postgres-auth"],
			configmaps: ["redis-config", "kafka-config", "postgres-config"],
		});

		// Promo CronJob - Delete after launch
		new FortifyCronJob(this, "promo", {
			name: "promo",
			version: jobsPackage.version,

			// Every other hour
			schedule: "0 * * * *",
			script: "broadcast",

			env: [
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
				{
					name: "MESSAGE",
					value: "!date 2020-08-20T18:00:00.000Z",
				},
			],
			secrets: ["postgres-auth"],
			configmaps: ["redis-config", "kafka-config", "postgres-config"],
		});
	}
}

const app = new App();
new ClusterSetup(app, "cluster");
new Fortify(app, "fortify");
app.synth();
