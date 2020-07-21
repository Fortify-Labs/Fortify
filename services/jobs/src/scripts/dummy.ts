import { injectable } from "inversify";
import debug = require("debug");

import { FortifyScript } from "../scripts";

@injectable()
export class DummyScript implements FortifyScript {
	name = "DummyScript";

	async handler() {
		debug("app::DummyScript")("Handler called");
	}
}
