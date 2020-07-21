import "reflect-metadata";
import { Container } from "inversify";

// import { PostgresConnector } from "@shared/connectors/postgres";
// import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";

import { FortifyScript } from "./scripts";

import { DummyScript } from "./scripts/dummy";
import { LeaderboardImportService } from "./scripts/leaderboardImport";

const container = new Container({ autoBindInjectable: true });

// container.bind(KafkaConnector).toConstantValue(new KafkaConnector());
// container.bind(PostgresConnector).toConstantValue(new PostgresConnector());
container.bind(RedisConnector).toConstantValue(new RedisConnector());

// Scripts are bound to their cli invocable name
container.bind<FortifyScript>("dummy").to(DummyScript);
container.bind<FortifyScript>("import").to(LeaderboardImportService);

export { container };
