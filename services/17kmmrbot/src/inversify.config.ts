import "reflect-metadata";
import { Container } from "inversify";

import { TwitchCommand } from "./definitions/twitchCommand";

import { Logger } from "@shared/logger";

import { Secrets } from "./secrets";

import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";

import { CountdownCommand } from "./commands/countdown";
import { NotablePlayersCommand } from "./commands/notablePlayers";
import { DevCommands } from "./commands/dev";
import { CreditsCommand } from "./commands/credits";
import { MMRCommand } from "./commands/mmr";
import { LeftCommand } from "./commands/left";
import { HelpCommand } from "./commands/help";
import { MatchCommand } from "./commands/match";
import { CodeCommand } from "./commands/code";

import { SecretsManager } from "@shared/services/secrets";
import { HealthCheckable } from "@shared/services/healthCheck";
import { MetricsService } from "@shared/services/metrics";
import { Connector } from "@shared/definitions/connector";

const container = new Container({ autoBindInjectable: true });

container.bind(Logger).toSelf().inSingletonScope();

container.bind(Secrets).toSelf().inSingletonScope();
container.bind(SecretsManager).toService(Secrets);

container.bind(MetricsService).toSelf().inSingletonScope();

container.bind<TwitchCommand>("command").to(CountdownCommand);
container.bind<TwitchCommand>("command").to(NotablePlayersCommand);
container.bind<TwitchCommand>("command").to(DevCommands);
container.bind<TwitchCommand>("command").to(CreditsCommand);
container.bind<TwitchCommand>("command").to(MMRCommand);
container.bind<TwitchCommand>("command").to(LeftCommand);
container.bind<TwitchCommand>("command").to(MatchCommand);
container.bind<TwitchCommand>("command").to(CodeCommand);

// Separate help command from other commands to avoid a circular dependency
container.bind<TwitchCommand>(HelpCommand).toSelf();

container.bind(KafkaConnector).toSelf().inSingletonScope();
container.bind(PostgresConnector).toSelf().inSingletonScope();
container.bind(RedisConnector).toSelf().inSingletonScope();

container.bind<Connector>("connector").toService(KafkaConnector);
container.bind<Connector>("connector").toService(PostgresConnector);
container.bind<Connector>("connector").toService(RedisConnector);

container.bind<HealthCheckable>("healthCheck").toService(KafkaConnector);
container.bind<HealthCheckable>("healthCheck").toService(PostgresConnector);
container.bind<HealthCheckable>("healthCheck").toService(RedisConnector);

export { container };
