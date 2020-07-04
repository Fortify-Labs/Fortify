import "reflect-metadata";
import { Container } from "inversify";

import { TwitchCommand } from "./definitions/twitchCommand";

import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";

import { CountdownCommand } from "./commands/countdown";
import { NotablePlayersCommand } from "./commands/notablePlayers";
import { DevCommands } from "./commands/dev";
import { CreditsCommand } from "./commands/credits";

const container = new Container({ autoBindInjectable: true });

container.bind<TwitchCommand>("command").to(CountdownCommand);
container.bind<TwitchCommand>("command").to(NotablePlayersCommand);
container.bind<TwitchCommand>("command").to(DevCommands);
container.bind<TwitchCommand>("command").to(CreditsCommand);

container.bind(KafkaConnector).toConstantValue(new KafkaConnector());
container.bind(PostgresConnector).toConstantValue(new PostgresConnector());
container.bind(RedisConnector).toConstantValue(new RedisConnector());

export { container };
