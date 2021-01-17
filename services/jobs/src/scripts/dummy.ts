import { inject, injectable } from "inversify";
import { Logger } from "@shared/logger";
import { FortifyScript } from "../scripts";

@injectable()
export class DummyScript implements FortifyScript {
	name = "DummyScript";

	constructor(@inject(Logger) private logger: Logger) {}

	async handler() {
		this.logger.info("Dummy script handler called");
	}
}
