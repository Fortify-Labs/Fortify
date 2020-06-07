import "reflect-metadata";
import { Container } from "inversify";
import { GQLModule } from "./definitions/module";
import { BaseModule } from "./graphql/modules/base";
import { GQLDirective } from "./definitions/directive";
import { AuthDirective } from "./graphql/directives/auth";
import { Database } from "./services/db";

const container = new Container({ autoBindInjectable: true });

container.bind<GQLModule>("module").to(BaseModule);

container.bind<GQLDirective>("directive").to(AuthDirective);

container.bind(Database).toConstantValue(new Database());

export { container };
