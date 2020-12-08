import { injectable } from "inversify";
import { Block } from "@shared/definitions/gsiTypes";
import { MatchState } from "@shared/state";

export interface ProcessArgs {
	matchState: MatchState;
	block: Block;
	sourceAccountID: string;
	timestamp: string;
}

@injectable()
export class MatchProcessor {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	process({ block, matchState, sourceAccountID, timestamp }: ProcessArgs) {
		matchState.updateCount += 1;

		return;
	}
}
