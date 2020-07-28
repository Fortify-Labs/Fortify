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
// import { ClusterIssuer } from "./imports/cert-manager.io/clusterissuer";
import { Secret, ObjectMeta, Namespace, ConfigMap } from "./imports/k8s";
import {
	Kafka,
	KafkaSpecKafkaStorageType,
	KafkaSpecKafkaStorageVolumesType,
	KafkaSpecZookeeperStorageType,
	KafkaOptions,
} from "./imports/kafka.strimzi.io/kafka";
import { Postgres } from "./imports/kubedb.com/postgres";
import { Redis } from "./imports/kubedb.com/redis";
import { RedisCommander } from "./src/redis-commander";

import backendPackage from "../../services/backend/package.json";
import frontendPackage from "../../services/frontend/package.json";
import fsmPackage from "../../services/fsm/package.json";
import gsiReceiverPackage from "../../services/gsi-receiver/package.json";
import twitchBotPackage from "../../services/17kmmrbot/package.json";
import jobsPackage from "../../services/jobs/package.json";
import {
	KafkaTopic,
	KafkaTopicOptions,
} from "./imports/kafka.strimzi.io/kafkatopic";
import { FortifyCronJob } from "./src/cronjob";

export interface CustomGatewayOptions extends GatewayOptions {
	metadata?: ObjectMeta;
}

export interface CustomKafkaOptions extends KafkaOptions {
	metadata?: ObjectMeta;
}

export interface CustomKafkaTopicOptions extends KafkaTopicOptions {
	metadata?: ObjectMeta;
}

const { JWT_SECRET, OAUTH_TOKEN, DOMAIN = "fortify.gg" } = process.env;

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

		new Namespace(this, "postgres-namespace", {
			metadata: {
				name: "postgres",
				namespace: undefined,
				labels: {
					"istio-injection": "enabled",
				},
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
			},
		});

		new Namespace(this, "redis-namespace", {
			metadata: {
				name: "redis",
				namespace: undefined,
				labels: {
					"istio-injection": "enabled",
				},
			},
		});

		new Redis(this, "redis", {
			metadata: {
				name: "redis",
				namespace: "redis",
			},
			spec: {
				version: "5.0.3-v1",
				storageType: "Durable",
				storage: {
					storageClassName: "longhorn",
					accessModes: ["ReadWriteOnce"],
					resources: {
						requests: {
							storage: "1Gi",
						},
					},
				},
			},
		});

		new RedisCommander(this, "redis-commander", {
			REDIS_HOST: "redis.redis",
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

		new ConfigMap(this, "redis-config", {
			metadata: {
				name: "redis-config",
			},
			data: {
				REDIS_URL: "redis://redis.redis:6379",
			},
		});

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
						hosts: [DOMAIN, `api.${DOMAIN}`, `gsi.${DOMAIN}`],
					},
				],
			},
		} as CustomGatewayOptions);

		// Fortify web services
		new WebService(this, "backend", {
			name: "backend",
			version: backendPackage.version,
			service: {
				name: "backend",
				containerPort: 8080,
				port: 8080,
			},
			env: [
				{ name: "MY_PORT", value: "8080" },
				// TODO: Change this to production once access to gql ui is not needed anymore
				{ name: "NODE_ENV", value: "development" },
				{ name: "APP_URL", value: "https://api.fortify.gg" },
			],
			secrets: ["postgres-auth", "jwt-secret"],
			configmaps: ["postgres-config", "kafka-config"],
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
					name: "GRAPHQL_URI",
					value: "https://api.fortify.gg/graphql",
				},
				{
					name: "GRAPHQL_WS_URI",
					value: "wss://api.fortify.gg/graphql",
				},
			],
			service: {
				name: "frontend",
				containerPort: 3000,
				port: 3000,
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
			configmaps: ["kafka-config"],
			service: {
				name: "gsi-receiver",
				containerPort: 8080,
				port: 8080,
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
			],
			secrets: ["postgres-auth", "twitch-bot-secret"],
			configmaps: ["postgres-config", "redis-config", "kafka-config"],
		});

		new FortifyDeployment(this, "fsm", {
			name: "fsm",
			version: fsmPackage.version,
			env: [
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
			],
			secrets: ["jwt-secret"],
			configmaps: ["redis-config", "kafka-config"],
		});

		// CronJobs
		new FortifyCronJob(this, "import-standard", {
			name: "import-standard",
			version: jobsPackage.version,

			schedule: "15 * * * *",
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
			configmaps: ["redis-config", "kafka-config"],
		});
		new FortifyCronJob(this, "import-turbo", {
			name: "import-turbo",
			version: jobsPackage.version,

			schedule: "15 * * * *",
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
			configmaps: ["redis-config", "kafka-config"],
		});
		new FortifyCronJob(this, "import-duos", {
			name: "import-duos",
			version: jobsPackage.version,

			schedule: "15 * * * *",
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
			configmaps: ["redis-config", "kafka-config"],
		});
	}
}

const app = new App();
new ClusterSetup(app, "cluster");
new Fortify(app, "fortify");
app.synth();
