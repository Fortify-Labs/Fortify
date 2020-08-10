import "reflect-metadata";
import { Container } from "inversify";

import { GQLModule } from "./definitions/module";
import { GQLDirective } from "./definitions/directive";

import { AuthDirective } from "./graphql/directives/auth";

import { BaseModule } from "./graphql/modules/base";
import { DebugModule } from "./graphql/modules/debug";
import { UserModule } from "./graphql/modules/user";
import { MatchModule } from "./graphql/modules/match";
import { LobbyModule } from "./graphql/modules/lobby";

import { PostgresConnector } from "@shared/connectors/postgres";
import { RedisConnector } from "@shared/connectors/redis";

const container = new Container({ autoBindInjectable: true });

container.bind<GQLModule>("module").to(BaseModule);
container.bind<GQLModule>("module").to(DebugModule);
container.bind<GQLModule>("module").to(UserModule);
container.bind<GQLModule>("module").to(MatchModule);
container.bind<GQLModule>("module").to(LobbyModule);

container.bind<GQLDirective>("directive").to(AuthDirective);

container.bind(PostgresConnector).toConstantValue(new PostgresConnector());
container.bind(RedisConnector).toConstantValue(new RedisConnector());

export { container };
