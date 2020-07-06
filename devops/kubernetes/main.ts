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

export interface CustomGatewayOptions extends GatewayOptions {
	metadata?: ObjectMeta;
}

export interface CustomKafkaOptions extends KafkaOptions {
	metadata?: ObjectMeta;
}

const {
	// ACME_SERVER,
	// ACME_EMAIL,
	// ACME_CF_EMAIL,
	// CF_TOKEN,
	JWT_SECRET,
	OAUTH_TOKEN,
	// STAGING_ACME_SERVER,
	// STAGING_ACME_EMAIL,
	// STAGING_ACME_CF_EMAIL,
} = process.env;

export class ClusterSetup extends Chart {
	constructor(scope: Construct, name: string) {
		super(scope, name, { namespace: "fortify" });

		new Namespace(this, "namespace", {
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
				name: "kafka-cluster",
			},
			spec: {
				kafka: {
					version: "2.5.0",
					replicas: 1,
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
								size: "10Gi",
								deleteClaim: false,
							},
						],
					},
				},
				zookeeper: {
					replicas: 1,
					storage: {
						type: KafkaSpecZookeeperStorageType.PERSISTENT_CLAIM,
						size: "10Gi",
						deleteClaim: false,
					},
				},
				entityOperator: {
					topicOperator: {},
				},
			},
		} as CustomKafkaOptions);

		new Postgres(this, "postgres", {
			metadata: {
				name: "postgres",
			},
			spec: {
				version: "11.2",
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

		new Redis(this, "redis", {
			metadata: {
				name: "redis",
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

		new RedisCommander(this, "redis-commander");
	}
}

export class Fortify extends Chart {
	constructor(scope: Construct, name: string) {
		super(scope, name, { namespace: "fortify" });

		// define resources here

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

		new ConfigMap(this, "kafka-config", {
			metadata: {
				name: "kafka-config",
			},
			data: {
				KAFKA_BROKERS: '["kafka-cluster-kafka-bootstrap:9092"]',
			},
		});

		new ConfigMap(this, "postgres-config", {
			metadata: {
				name: "postgres-config",
			},
			data: {
				POSTGRES_HOST: "postgres",
				POSTGRES_PORT: "5432",
				POSTGRES_DATABASE: "postgres",
			},
		});

		new ConfigMap(this, "redis-config", {
			metadata: {
				name: "redis-config",
			},
			data: {
				REDIS_URL: "redis://redis:6379",
			},
		});

		// new Secret(this, "cloudflare-api-token", {
		// 	metadata: {
		// 		name: "cloudflare-api-token",
		// 	},
		// 	type: "Opaque",
		// 	stringData: {
		// 		"api-token": CF_TOKEN ?? "",
		// 	},
		// });

		// TODO: Fix this at one point; Gonna re-use my old cf based cluster issuers
		// new ClusterIssuer(this, "f-letsencrypt", {
		// 	metadata: {
		// 		name: "f-letsencrypt",
		// 	},
		// 	spec: {
		// 		acme: {
		// 			server: ACME_SERVER ?? "",
		// 			email: ACME_EMAIL ?? "",
		// 			privateKeySecretRef: {
		// 				name: "issuer-account-key",
		// 			},
		// 			solvers: [
		// 				{
		// 					dns01: {
		// 						cloudflare: {
		// 							email: ACME_CF_EMAIL ?? "",
		// 							apiTokenSecretRef: {
		// 								name: "cloudflare-api-token",
		// 								key: "api-token",
		// 							},
		// 						},
		// 					},
		// 				},
		// 			],
		// 		},
		// 	},
		// });

		// new ClusterIssuer(this, "f-letsencrypt-staging", {
		// 	metadata: {
		// 		name: "f-letsencrypt-staging",
		// 	},
		// 	spec: {
		// 		acme: {
		// 			server: STAGING_ACME_SERVER ?? "",
		// 			email: STAGING_ACME_EMAIL ?? "",
		// 			privateKeySecretRef: {
		// 				name: "staging-issuer-account-key",
		// 			},
		// 			solvers: [
		// 				{
		// 					dns01: {
		// 						cloudflare: {
		// 							email: STAGING_ACME_CF_EMAIL ?? "",
		// 							apiTokenSecretRef: {
		// 								name: "cloudflare-api-token",
		// 								key: "api-token",
		// 							},
		// 						},
		// 					},
		// 				},
		// 			],
		// 		},
		// 	},
		// });

		new Certificate(this, "fortify-ssl-cert", {
			metadata: {
				name: "fortify-ssl-cert",
				namespace: "istio-system",
			},
			spec: {
				secretName: "fortify-ssl-cert",
				commonName: "fortify.gg",
				dnsNames: ["fortify.gg", "api.fortify.gg", "gsi.fortify.gg"],
				issuerRef: {
					name: "cf-letsencrypt-staging",
					kind: "ClusterIssuer",
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
			env: [
				{ name: "MY_PORT", value: "8080" },
				{ name: "NODE_ENV", value: "production" },
				{ name: "APP_URL", value: "https://api.fortify.gg" },
			],
			secrets: ["postgres-auth", "jwt-secret"],
			configmaps: ["postgres-config"],
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
								host: "backend-service",
							},
						},
					],
				},
			],
		});

		new WebService(this, "frontend", {
			name: "frontend",
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
			hosts: ["fortify.gg"],
			http: [
				{
					route: [
						{
							destination: {
								port: {
									number: 3000,
								},
								host: "frontend-service",
							},
						},
					],
				},
			],
		});

		new WebService(this, "gsi-receiver", {
			name: "gsi-receiver",
			env: [
				{ name: "MY_PORT", value: "8080" },
				{ name: "KAFKA_CLIENTID", value: "gsi-receiver" },
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
			hosts: ["gsi.fortify.gg"],
			http: [
				{
					route: [
						{
							destination: {
								port: {
									number: 8080,
								},
								host: "gsi-receiver-service",
							},
						},
					],
				},
			],
		});

		new FortifyDeployment(this, "17kmmrbot", {
			name: "17kmmrbot",
			env: [
				{ name: "BOT_USERNAME", value: "17kmmrbot" },
				{ name: "KAFKA_CLIENTID", value: "17kmmrbot" },
				{ name: "KAFKA_TOPIC", value: "gsi" },
			],
			secrets: ["postgres-auth", "twitch-bot-secret"],
			configmaps: ["postgres-config", "redis-config", "kafka-config"],
		});

		new FortifyDeployment(this, "fsm", {
			name: "fsm",
			env: [{ name: "KAFKA_CLIENT_ID", value: "fsm" }],
			secrets: ["jwt-secret"],
			configmaps: ["redis-config", "kafka-config"],
		});
	}
}

const app = new App();
new ClusterSetup(app, "cluster");
new Fortify(app, "fortify");
app.synth();
