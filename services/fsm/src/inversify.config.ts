import "reflect-metadata";
import { Container } from "inversify";

import { PostgresConnector } from "@shared/connectors/postgres";
import { KafkaConnector } from "@shared/connectors/kafka";
import { RedisConnector } from "@shared/connectors/redis";
import { MatchService } from "@shared/services/match";
import { EventService } from "@shared/services/eventService";

import { StateReducer } from "./definitions/stateReducer";
import { CommandReducer } from "./definitions/commandReducer";

import { PublicPlayerState, PrivatePlayerState } from "./gsiTypes";

import { LobbyPlayerReducer } from "./reducers/public/lobbyReducer";
import { ResetCommandReducer } from "./reducers/commands";
import { DummyPrivateStateReducer } from "./reducers/private/privatePlayerState";
import { PoolReducer } from "./reducers/public/poolReducer";

const container = new Container({ autoBindInjectable: true });

container
	.bind<StateReducer<PublicPlayerState>>("public")
	.to(LobbyPlayerReducer);
container.bind<StateReducer<PublicPlayerState>>("public").to(PoolReducer);
container
	.bind<StateReducer<PrivatePlayerState>>("private")
	.to(DummyPrivateStateReducer);
container.bind<CommandReducer>("command").to(ResetCommandReducer);

container.bind(KafkaConnector).toConstantValue(new KafkaConnector());
container.bind(PostgresConnector).toConstantValue(new PostgresConnector());
container.bind(RedisConnector).toConstantValue(new RedisConnector());

container.bind(MatchService).to(MatchService);
container.bind(EventService).to(EventService);

export { container };
