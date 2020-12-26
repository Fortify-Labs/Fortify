import { inject, injectable } from "inversify";
import { Logging } from "@shared/logging";
import { FortifyScript } from "../scripts";
import winston from "winston";

@injectable()
export class DummyScript implements FortifyScript {
	name = "DummyScript";

	logger: winston.Logger;

	constructor(@inject(Logging) private logging: Logging) {
		this.logger = logging.createLogger();
	}

	async handler() {
		this.logger.info("Dummy script handler called");
	}
}
