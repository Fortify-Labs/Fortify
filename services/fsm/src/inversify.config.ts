import "reflect-metadata";
import { Container } from "inversify";

import {
	PostgresConnector,
	PostgresSecretsRequest,
} from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";

import { CommandReducer } from "./definitions/commandReducer";

import { ResetCommandReducer } from "./reducers/commands";

import { SecretsManager, SecretsRequest } from "@shared/services/secrets";
import { Secrets } from "./secrets";
import { HealthCheckable } from "@shared/services/healthCheck";
import { Connector } from "@shared/definitions/connector";

const container = new Container({ autoBindInjectable: true });

container.bind(Secrets).toSelf().inSingletonScope();
container.bind(SecretsManager).toService(Secrets);

container.bind<CommandReducer>("command").to(ResetCommandReducer);

container.bind(KafkaConnector).toSelf().inSingletonScope();
container.bind(PostgresConnector).toSelf().inSingletonScope();
container.bind(RedisConnector).toSelf().inSingletonScope();

container.bind<Connector>("connector").toService(KafkaConnector);
container.bind<Connector>("connector").toService(PostgresConnector);
container.bind<Connector>("connector").toService(RedisConnector);

container.bind<HealthCheckable>("healthCheck").toService(KafkaConnector);
container.bind<HealthCheckable>("healthCheck").toService(PostgresConnector);
container.bind<HealthCheckable>("healthCheck").toService(RedisConnector);

container
	.bind<SecretsRequest>("secrets")
	.to(PostgresSecretsRequest)
	.inSingletonScope();

export { container };
