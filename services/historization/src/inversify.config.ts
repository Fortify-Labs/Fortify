import "reflect-metadata";
import { Container } from "inversify";

import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";
import { InfluxDBConnector } from "@shared/connectors/influxdb";

import { EventService } from "@shared/services/eventService";
import { MatchService } from "@shared/services/match";

const container = new Container({ autoBindInjectable: true });

container.bind(PostgresConnector).toConstantValue(new PostgresConnector());
container.bind(KafkaConnector).toConstantValue(new KafkaConnector());
container.bind(RedisConnector).toConstantValue(new RedisConnector());
container.bind(InfluxDBConnector).toConstantValue(new InfluxDBConnector());

container.bind(EventService).to(EventService);
container.bind(MatchService).to(MatchService);

export { container };
