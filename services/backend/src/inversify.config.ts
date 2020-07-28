import "reflect-metadata";
import { Container } from "inversify";

import { GQLModule } from "./definitions/module";
import { GQLDirective } from "./definitions/directive";

import { AuthDirective } from "./graphql/directives/auth";

import { BaseModule } from "./graphql/modules/base";
import { DebugModule } from "./graphql/modules/debug";
import { PoolModule } from "./graphql/modules/pool";

import { PostgresConnector } from "@shared/connectors/postgres";

const container = new Container({ autoBindInjectable: true });

container.bind<GQLModule>("module").to(BaseModule);
container.bind<GQLModule>("module").to(DebugModule);
container.bind<GQLModule>("module").to(PoolModule);

container.bind<GQLDirective>("directive").to(AuthDirective);

container.bind(PostgresConnector).toConstantValue(new PostgresConnector());

export { container };
