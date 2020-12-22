import { config } from "dotenv";
config();

import { Construct } from "constructs";
import { App, Chart } from "cdk8s";

import { FortifyDeployment } from "./src/deployment";
import { WebService } from "./src/webservice";
import { KubeConfigMap, KubeSecret } from "./imports/k8s";

import backendPackage from "../../services/backend/package.json";
import frontendPackage from "../../services/frontend/package.json";
import fsmPackage from "../../services/fsm/package.json";
import gsiReceiverPackage from "../../services/gsi-receiver/package.json";
import twitchBotPackage from "../../services/17kmmrbot/package.json";
import jobsPackage from "../../services/jobs/package.json";
import historizationPackage from "../../services/historization/package.json";
import { FortifyCronJob } from "./src/cronjob";

import { ClusterSetupClean } from "./src/charts/clusterClean";

const {
	DOMAIN = "fortify.gg",
	ENVIRONMENT = "prod",
	GA_TRACKING_ID,
	REGISTRY,
	VAULT_TOKEN = "",
} = process.env;

// Sentry DSNs
const {
	SENTRY_DSN = "",
	TWITCH_BOT_SENTRY_DSN,
	GSI_RECEIVER_SENTRY_DSN,
	FSM_SENTRY_DSN,
	HISTORIZATION_SENTRY_DSN,
	BACKEND_SENTRY_DSN,
} = process.env;

export class Fortify extends Chart {
	constructor(scope: Construct, name: string) {
		super(scope, name, { namespace: "fortify" });

		// Default env variables
		const kafkaConfig = new KubeConfigMap(this, "kafka-config", {
			metadata: {
				name: "kafka-config",
			},
			data: {
				KAFKA_BROKERS: '["fortify-kafka-bootstrap.kafka:9092"]',
			},
		});

		const postgresConfig = new KubeConfigMap(this, "postgres-config", {
			metadata: {
				name: "postgres-config",
			},
			data: {
				POSTGRES_USER: "postgres",
				POSTGRES_HOST: "postgres.postgres",
				POSTGRES_PORT: "5432",
				POSTGRES_DATABASE: "postgres",
			},
		});

		const redisConfig = new KubeConfigMap(this, "redis-config", {
			metadata: {
				name: "redis-config",
			},
			data: {
				// REDIS_URL: "redis://redis.redis:6379",
				REDIS_SENTINEL: "rfs-redis.redis:26379",
				REDIS_SENTINEL_NAME: "mymaster",
			},
		});

		const influxdbConfig = new KubeConfigMap(this, "influxdb-config", {
			metadata: {
				name: "influxdb-config",
			},
			data: {
				INFLUXDB_ORG: "Fortify",
				INFLUXDB_BUCKET: "mmr",
				INFLUXDB_URL: "http://influxdb-rc.influxdb:8086",
			},
		});

		const vaultConfig = new KubeConfigMap(this, "vault-config", {
			data: {
				VAULT_ADDR: "http://vault.default:8200",
				VAULT_ENVIRONMENT: `/${ENVIRONMENT}`,
			},
		});
		const vaultSecret = new KubeSecret(this, "vault-secret", {
			stringData: {
				// TODO: Refactor this into k8s service account based auth
				VAULT_TOKEN,
			},
		});

		// Fortify web services
		new WebService(this, "backend", {
			name: "backend",
			version: backendPackage.version,
			replicas: 3,
			maxUnavailable: 1,
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
				{
					name: "TWITCH_CALLBACK_URL",
					value: `https://api.${DOMAIN}/auth/twitch/return`,
				},
				{
					name: "TWITCH_SUCCESS_REDIRECT",
					value: `https://${DOMAIN}/profile`,
				},
				{
					name: "TWITCH_FAILURE_REDIRECT",
					value: `https://${DOMAIN}/`,
				},
				{ name: "SENTRY_DSN", value: BACKEND_SENTRY_DSN },
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
				{
					name: "IGNORE_ERROR_CODES",
					value:
						"NOT_AUTHENTICATED;QUERY_PROFILE_NOT_ALLOWED;QUERY_LOBBY_FPS_LOBBY_ID;QUERY_LOBBY_FPS_NOT_FOUND;QUERY_LOBBY_MATCH_ID;QUERY_LOBBY_ID",
				},
			],
			secrets: [vaultSecret],
			configmaps: [
				postgresConfig,
				kafkaConfig,
				redisConfig,
				influxdbConfig,
				vaultConfig,
			],

			traefik: {
				entryPoints: ["web", "websecure"],
				namespace: "fortify",
				match: `Host(\`api.${DOMAIN}\`)`,
			},
		});

		new WebService(this, "frontend", {
			name: "frontend",
			replicas: 3,
			maxUnavailable: 1,
			version: frontendPackage.version,
			env: [
				{
					name: "NEXT_PUBLIC_GRAPHQL_URI",
					value: `http://backend:8080/graphql`,
				},
				{
					name: "NEXT_PUBLIC_GRAPHQL_WS_URI",
					value: `ws://backend:8080/graphql`,
				},
				{
					name: "NEXT_PUBLIC_LOGIN_URL",
					value: `https://api.${DOMAIN}/auth/steam`,
				},
				{
					name: "NEXT_PUBLIC_TWITCH_LOGIN_URL",
					value: `https://api.${DOMAIN}/auth/twitch`,
				},
				{
					name: "NEXT_PUBLIC_URL",
					value: `https://${DOMAIN}`,
				},
				{
					name: "NEXT_PUBLIC_GA_TRACKING_ID",
					value: GA_TRACKING_ID,
				},
				{
					name: "NEXT_PUBLIC_SENTRY_DSN",
					value: SENTRY_DSN,
				},
				{
					name: "NODE_ENV",
					value: "production",
				},
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
			],
			service: {
				name: "frontend",
				containerPort: 3000,
				port: 3000,
				portName: "http-frontend",
			},

			traefik: {
				entryPoints: ["web", "websecure"],
				namespace: "fortify",
				match: `Host(\`${DOMAIN}\`)`,
			},

			// TODO: Implement probes
			livenessProbe: null,
			readinessProbe: null,
		});

		new WebService(this, "gsi-receiver", {
			name: "gsi-receiver",
			replicas: 3,
			maxUnavailable: 1,
			version: gsiReceiverPackage.version,
			env: [
				{ name: "MY_PORT", value: "8080" },
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
				{ name: "KAFKA_TOPIC", value: "gsi" },
				{ name: "SENTRY_DSN", value: GSI_RECEIVER_SENTRY_DSN },
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
			],
			secrets: [vaultSecret],
			configmaps: [kafkaConfig, redisConfig, vaultConfig],
			service: {
				name: "gsi-receiver",
				containerPort: 8080,
				port: 8080,
				portName: "http-gsi-ingress",
			},

			traefik: {
				entryPoints: ["web", "websecure"],
				namespace: "fortify",
				match: `Host(\`gsi.${DOMAIN}\`)`,
			},
		});

		new WebService(this, "sentry-discord-webhook", {
			name: "sentry-discord-webhook",
			replicas: 1,
			version: "1.1.4",
			env: [
				{ name: "LISTEN_ADDRESS", value: ":8080" },
				{ name: "WEBHOOK_ENV", value: "prod" },
				{ name: "DISABLE_STARTUP_MESSAGE", value: "true" },
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
			],
			configmaps: [vaultConfig],
			secrets: [vaultSecret],
			service: {
				name: "sentry-discord-webhook",
				containerPort: 8080,
				port: 8080,
				portName: "http-sentry-discord-webhook",
			},

			traefik: {
				entryPoints: ["websecure"],
				namespace: "fortify",
				match: `Host(\`sentry.fortify.dev\`)`,
			},
		});

		new WebService(this, "sentry-discord-dev-webhook", {
			name: "sentry-discord-dev-webhook",
			replicas: 1,
			version: "1.1.4",
			image: REGISTRY + "sentry-discord-webhook:1.1.4",
			env: [
				{ name: "LISTEN_ADDRESS", value: ":8080" },
				{
					name: "WEBHOOK_ENV",
					value: "dev",
				},
				{ name: "DISABLE_STARTUP_MESSAGE", value: "true" },
			],
			configmaps: [vaultConfig],
			secrets: [vaultSecret],
			service: {
				name: "sentry-discord-dev-webhook",
				containerPort: 8080,
				port: 8080,
				portName: "http-sentry-discord-dev-webhook",
			},

			traefik: {
				entryPoints: ["websecure"],
				namespace: "fortify",
				match: `Host(\`sentry-dev.fortify.dev\`)`,
			},
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
				{ name: "SENTRY_DSN", value: TWITCH_BOT_SENTRY_DSN },
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
			],
			secrets: [vaultSecret],
			configmaps: [postgresConfig, redisConfig, kafkaConfig, vaultConfig],
		});

		new FortifyDeployment(this, "fsm", {
			name: "fsm",
			version: fsmPackage.version,
			replicas: 3,
			maxUnavailable: 1,
			env: [
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
				{
					name: "SENTRY_DSN",
					value: FSM_SENTRY_DSN,
				},
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
			],
			secrets: [vaultSecret],
			configmaps: [redisConfig, kafkaConfig, postgresConfig, vaultConfig],
		});

		new FortifyDeployment(this, "historization", {
			name: "historization",
			version: historizationPackage.version,
			replicas: 3,
			maxUnavailable: 1,
			env: [
				{
					name: "SERVICE_NAME",
					value: "historization",
				},
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
				{
					name: "SENTRY_DSN",
					value: HISTORIZATION_SENTRY_DSN,
				},
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
			],
			configmaps: [
				redisConfig,
				kafkaConfig,
				influxdbConfig,
				postgresConfig,
				vaultConfig,
			],
			secrets: [vaultSecret],
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
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
			],
			secrets: [vaultSecret],
			configmaps: [redisConfig, kafkaConfig, postgresConfig, vaultConfig],
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
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
			],
			secrets: [vaultSecret],
			configmaps: [redisConfig, kafkaConfig, postgresConfig, vaultConfig],
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
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
			],
			secrets: [vaultSecret],
			configmaps: [redisConfig, kafkaConfig, postgresConfig, vaultConfig],
		});
		new FortifyCronJob(this, "db-cleanup", {
			name: "db-cleanup",
			version: jobsPackage.version,

			// Every hour
			suspend: true,
			schedule: "0 * * * *",
			script: "clean_db",

			env: [
				{
					name: "KAFKA_CLIENT_ID",
					valueFrom: { fieldRef: { fieldPath: "metadata.name" } },
				},
				{ name: "SENTRY_TRACE_SAMPLE_RATE", value: "0" },
			],
			secrets: [vaultSecret],
			configmaps: [redisConfig, kafkaConfig, postgresConfig, vaultConfig],
		});
	}
}

const app = new App();
new ClusterSetupClean(app, "cluster");
new Fortify(app, "fortify");
app.synth();
