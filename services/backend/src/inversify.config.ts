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
import { GSIModule } from "./graphql/modules/gsi";
import { LeaderboardModule } from "./graphql/modules/leaderboard";

import { PostgresConnector } from "@shared/connectors/postgres";
import { RedisConnector } from "@shared/connectors/redis";
import { InfluxDBConnector } from "@shared/connectors/influxdb";
import { VaultConnector } from "@shared/connectors/vault";

import { HealthCheckable } from "@shared/services/healthCheck";

import { SecretsManager } from "@shared/services/secrets";
import { Secrets } from "./secrets";

const container = new Container({ autoBindInjectable: true });

container.bind(Secrets).toSelf().inSingletonScope();
container.bind(SecretsManager).toService(Secrets);

container.bind<GQLModule>("module").to(BaseModule);
container.bind<GQLModule>("module").to(DebugModule);
container.bind<GQLModule>("module").to(UserModule);
container.bind<GQLModule>("module").to(MatchModule);
container.bind<GQLModule>("module").to(LobbyModule);
container.bind<GQLModule>("module").to(GSIModule);
container.bind<GQLModule>("module").to(LeaderboardModule);

container.bind<GQLDirective>("directive").to(AuthDirective);

container.bind(InfluxDBConnector).toSelf().inSingletonScope();
container.bind(PostgresConnector).toSelf().inSingletonScope();
container.bind(RedisConnector).toSelf().inSingletonScope();

container.bind<HealthCheckable>("healthCheck").toService(InfluxDBConnector);
container.bind<HealthCheckable>("healthCheck").toService(PostgresConnector);
container.bind<HealthCheckable>("healthCheck").toService(RedisConnector);
container.bind<HealthCheckable>("healthCheck").toService(VaultConnector);

export { container };
