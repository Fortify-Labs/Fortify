import "reflect-metadata";
import { Container } from "inversify";

// import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";

import { StateReducer } from "./definitions/stateReducer";
import { CommandReducer } from "./definitions/commandReducer";

import { PublicPlayerState, PrivatePlayerState } from "./gsiTypes";

import { PlayerReducer } from "./reducers/publicPlayerState";
import { ResetCommandReducer } from "./reducers/commands";
import { DummyPrivateStateReducer } from "./reducers/privatePlayerState";

const container = new Container({ autoBindInjectable: true });

container.bind<StateReducer<PublicPlayerState>>("public").to(PlayerReducer);
container
	.bind<StateReducer<PrivatePlayerState>>("private")
	.to(DummyPrivateStateReducer);
container.bind<CommandReducer>("command").to(ResetCommandReducer);

container.bind(KafkaConnector).toConstantValue(new KafkaConnector());
// container.bind(PostgresConnector).toConstantValue(new PostgresConnector());
container.bind(RedisConnector).toConstantValue(new RedisConnector());

export { container };
