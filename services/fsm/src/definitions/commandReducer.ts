import { FortifyEvent } from "@shared/events/events";
import { SystemEventType } from "@shared/events/systemEvents";

export interface CommandReducer {
	name: string;

	processor: (event: FortifyEvent<SystemEventType>) => Promise<boolean>;
}
