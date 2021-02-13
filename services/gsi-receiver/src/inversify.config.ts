import "reflect-metadata";
import { Container } from "inversify";

import { HealthCheckable } from "@shared/services/healthCheck";

import { KafkaConnector } from "@shared/connectors/kafka";

import { SecretsManager } from "@shared/services/secrets";
import { Secrets } from "./secrets";
import { Connector } from "@shared/definitions/connector";

import { MetricsService } from "@shared/services/metrics";

const container = new Container({ autoBindInjectable: true });

container.bind(Secrets).toSelf().inSingletonScope();
container.bind(SecretsManager).toService(Secrets);

container.bind(MetricsService).toSelf().inSingletonScope();

container.bind(KafkaConnector).toSelf().inSingletonScope();

container.bind<Connector>("connector").toService(KafkaConnector);

container.bind<HealthCheckable>("healthCheck").toService(KafkaConnector);

export { container };
