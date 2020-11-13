import "reflect-metadata";
import { Container } from "inversify";

import { TwitchCommand } from "./definitions/twitchCommand";

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

import { SecretsManager } from "@shared/services/secrets";

const container = new Container({ autoBindInjectable: true });

container.bind(SecretsManager).to(Secrets).inSingletonScope();
container.bind(Secrets).toSelf().inSingletonScope();

container.bind<TwitchCommand>("command").to(CountdownCommand);
container.bind<TwitchCommand>("command").to(NotablePlayersCommand);
container.bind<TwitchCommand>("command").to(DevCommands);
container.bind<TwitchCommand>("command").to(CreditsCommand);
container.bind<TwitchCommand>("command").to(MMRCommand);
container.bind<TwitchCommand>("command").to(LeftCommand);
container.bind<TwitchCommand>("command").to(MatchCommand);

// Separate help command from other commands to avoid a circular dependency
container.bind<TwitchCommand>(HelpCommand).toSelf();

container.bind(KafkaConnector).toSelf().inSingletonScope();
container.bind(PostgresConnector).toSelf().inSingletonScope();
container.bind(RedisConnector).toSelf().inSingletonScope();

export { container };
