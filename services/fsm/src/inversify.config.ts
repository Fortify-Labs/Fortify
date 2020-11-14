import "reflect-metadata";
import { Container } from "inversify";

import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";

import { StateReducer } from "./definitions/stateReducer";
import { CommandReducer } from "./definitions/commandReducer";

import { PublicPlayerState, PrivatePlayerState } from "./gsiTypes";

import { LobbyPlayerReducer } from "./reducers/public/lobbyReducer";
import { ResetCommandReducer } from "./reducers/commands";
import { DummyPrivateStateReducer } from "./reducers/private/privatePlayerState";
import { PoolReducer } from "./reducers/public/poolReducer";
import { RankTierReducer } from "./reducers/public/rankTierReducer";

import { SecretsManager } from "@shared/services/secrets";
import { Secrets } from "./secrets";
import { HealthCheckable } from "@shared/services/healthCheck";

const container = new Container({ autoBindInjectable: true });

container.bind(Secrets).toSelf().inSingletonScope();
container.bind(SecretsManager).toService(Secrets);

container
	.bind<StateReducer<PublicPlayerState>>("public")
	.to(LobbyPlayerReducer);
container.bind<StateReducer<PublicPlayerState>>("public").to(PoolReducer);
container.bind<StateReducer<PublicPlayerState>>("public").to(RankTierReducer);
container
	.bind<StateReducer<PrivatePlayerState>>("private")
	.to(DummyPrivateStateReducer);
container.bind<CommandReducer>("command").to(ResetCommandReducer);

container.bind(KafkaConnector).toSelf().inSingletonScope();
container.bind(PostgresConnector).toSelf().inSingletonScope();
container.bind(RedisConnector).toSelf().inSingletonScope();

container.bind<HealthCheckable>("healthCheck").toService(KafkaConnector);
container.bind<HealthCheckable>("healthCheck").toService(PostgresConnector);
container.bind<HealthCheckable>("healthCheck").toService(RedisConnector);

export { container };
