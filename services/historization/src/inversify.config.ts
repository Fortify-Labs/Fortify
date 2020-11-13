import "reflect-metadata";
import { Container } from "inversify";

import { SecretsManager } from "@shared/services/secrets";
import { Secrets } from "./secrets";

import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";
import { InfluxDBConnector } from "@shared/connectors/influxdb";

const container = new Container({ autoBindInjectable: true });

container.bind(SecretsManager).to(Secrets).inSingletonScope();
container.bind(Secrets).toSelf().inSingletonScope();

container.bind(PostgresConnector).toSelf().inSingletonScope();
container.bind(KafkaConnector).toSelf().inSingletonScope();
container.bind(RedisConnector).toSelf().inSingletonScope();
container.bind(InfluxDBConnector).toSelf().inSingletonScope();

export { container };
