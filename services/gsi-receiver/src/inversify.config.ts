import "reflect-metadata";
import { Container } from "inversify";

// import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
// import { RedisConnector } from "@shared/connectors/redis";

const container = new Container({ autoBindInjectable: true });

container.bind(KafkaConnector).toConstantValue(new KafkaConnector());
// container.bind(PostgresConnector).toConstantValue(new PostgresConnector());
// container.bind(RedisConnector).toConstantValue(new RedisConnector());

export { container };
