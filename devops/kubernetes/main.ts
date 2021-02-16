import { config } from "dotenv";
config();

import { App } from "cdk8s";

import { Cluster } from "./src/cluster";
import { Fortify } from "./src/fortify";
import { AkhqChart } from "./src/charts/akhq/akhq";
import { CICDUser } from "./src/charts/cicd-user/cicdUser";
import { GrafanaChart } from "./src/charts/grafana/grafana";
import { KowlChart } from "./src/charts/kowl/kowl";
import { PostgresOperator } from "./src/charts/postgres-operator/postgresOperator";
import { PrometheusChart } from "./src/charts/prometheus/prometheus";
import { RedisOperatorChart } from "./src/charts/redis-operator/redis-operator";
import { TraefikChart } from "./src/charts/traefik/traefik";
import { VaultChart } from "./src/charts/vault/vault";

const { CLUSTER_SETUP } = process.env;

const app = new App();

if (CLUSTER_SETUP) {
	new AkhqChart(app, "akhq");
	new CICDUser(app, "cicd");
	new GrafanaChart(app, "grafana");
	new KowlChart(app, "kowl");
	new PostgresOperator(app, "postgres");
	new PrometheusChart(app, "prometheus");
	new RedisOperatorChart(app, "redis");
	new TraefikChart(app, "traefik");
	new VaultChart(app, "vault");
}

new Cluster(app, "cluster");
new Fortify(app, "fortify");

app.synth();
