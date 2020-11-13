import "reflect-metadata";
import { Container } from "inversify";

import { KafkaConnector } from "@shared/connectors/kafka";
import { SecretsManager } from "@shared/services/secrets";
import { Secrets } from "./secrets";

const container = new Container({ autoBindInjectable: true });

container.bind(SecretsManager).to(Secrets).inSingletonScope();
container.bind(Secrets).toSelf().inSingletonScope();

container.bind(KafkaConnector).toSelf().inSingletonScope();

export { container };
