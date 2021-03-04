import "reflect-metadata";
import { Container } from "inversify";

import { SecretsManager } from "@shared/services/secrets";
import { Secrets } from "./secrets";

import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";

import { FortifyScript } from "./scripts";

import { DummyScript } from "./scripts/dummy";
import { LeaderboardImportService } from "./scripts/leaderboardImport";
import { DBCleanupScript } from "./scripts/dbCleaner";
import { BroadcastNotificationScript } from "./scripts/broadcastNotifications";
import { Connector } from "@shared/definitions/connector";
import { TwitchOnlineScript } from "./scripts/twitchOnline";

const container = new Container({ autoBindInjectable: true });

container.bind(Secrets).toSelf().inSingletonScope();
container.bind(SecretsManager).toService(Secrets);

container.bind(KafkaConnector).toSelf().inSingletonScope();
container.bind(PostgresConnector).toSelf().inSingletonScope();
container.bind(RedisConnector).toSelf().inSingletonScope();

container.bind<Connector>("connector").toService(KafkaConnector);
container.bind<Connector>("connector").toService(PostgresConnector);
container.bind<Connector>("connector").toService(RedisConnector);

// Scripts are bound to their cli invocable name
container.bind<FortifyScript>("dummy").to(DummyScript);
container.bind<FortifyScript>("import").to(LeaderboardImportService);
container.bind<FortifyScript>("clean_db").to(DBCleanupScript);
container.bind<FortifyScript>("broadcast").to(BroadcastNotificationScript);
container.bind<FortifyScript>("twitch_online").to(TwitchOnlineScript);

export { container };
