import { config } from "dotenv";
config();

import { App } from "cdk8s";

import { ClusterSetup } from "./src/cluster";
import { Fortify } from "./src/fortify";

const app = new App();

new ClusterSetup(app, "cluster");
new Fortify(app, "fortify");

app.synth();
