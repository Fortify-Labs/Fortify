import { config } from "dotenv";
config();

import { Construct } from "constructs";
import { App, Chart } from "cdk8s";

import { FortifyDeployment } from "./src/deployment";
import { WebService } from "./src/webservice";
import { Secret, ConfigMap } from "./imports/k8s";

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
	JWT_SECRET,
	OAUTH_TOKEN,
	DOMAIN = "fortify.gg",
	POSTGRES_PASSWORD = "",
	INFLUXDB_TOKEN = "",
	STEAM_WEB_API_KEY = "",
	TWITCH_CLIENT_ID = "",
	TWITCH_SECRET = "",
	GA_TRACKING_ID,
} = process.env;

// Sentry DSNs
const { SENTRY_DSN = "", TWITCH_BOT_SENTRY_DSN } = process.env;

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
				INFLUXDB_URL: "http://influxdb-rc.influxdb:8086",
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

		new Secret(this, "twitch-secret", {
			metadata: {
				name: "twitch-secret",
			},
			stringData: {
				TWITCH_SECRET,
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
					name: "TWITCH_CLIENT_ID",
					value: TWITCH_CLIENT_ID,
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
			],
			secrets: [
				"postgres-auth",
				"jwt-secret",
				"influxdb-secret",
				"steam-web-api-secret",
				"twitch-secret",
			],
			configmaps: [
				"postgres-config",
				"kafka-config",
				"redis-config",
				"influxdb-config",
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
			],
			secrets: ["jwt-secret"],
			configmaps: ["kafka-config", "redis-config"],
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
			],
			secrets: ["postgres-auth", "twitch-bot-secret"],
			configmaps: ["postgres-config", "redis-config", "kafka-config"],
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
			],
			secrets: ["jwt-secret", "postgres-auth"],
			configmaps: ["redis-config", "kafka-config", "postgres-config"],
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
	}
}

const app = new App();
new ClusterSetupClean(app, "cluster");
new Fortify(app, "fortify");
app.synth();
