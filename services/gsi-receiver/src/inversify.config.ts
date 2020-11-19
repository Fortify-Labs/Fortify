import "reflect-metadata";
import { Container } from "inversify";

import { HealthCheckable } from "@shared/services/healthCheck";

import { KafkaConnector } from "@shared/connectors/kafka";

import { SecretsManager } from "@shared/services/secrets";
import { Secrets } from "./secrets";

const container = new Container({ autoBindInjectable: true });

container.bind(Secrets).toSelf().inSingletonScope();
container.bind(SecretsManager).toService(Secrets);

container.bind(KafkaConnector).toSelf().inSingletonScope();

container.bind<HealthCheckable>("healthCheck").toService(KafkaConnector);

export { container };
