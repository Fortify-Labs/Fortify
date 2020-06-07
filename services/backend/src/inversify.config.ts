import "reflect-metadata";
import { Container } from "inversify";

import { GQLModule } from "./definitions/module";
import { GQLDirective } from "./definitions/directive";

import { Database } from "./services/db";

import { AuthDirective } from "./graphql/directives/auth";

import { BaseModule } from "./graphql/modules/base";
import { DebugModule } from "./graphql/modules/debug";

const container = new Container({ autoBindInjectable: true });

container.bind<GQLModule>("module").to(BaseModule);
container.bind<GQLModule>("module").to(DebugModule);

container.bind<GQLDirective>("directive").to(AuthDirective);

container.bind(Database).toConstantValue(new Database());

export { container };
