export const KafkaTopic17kmmrbot = "17kmmrbot-commands";

export enum Fortify17kmmrCommandType {
	UNDEFINED,
	JOIN,
	LEAVE,
	SAY,
}

export interface Fortify17kmmrCommand {
	channel: string;
	payload?: Record<string, unknown>;
	type: Fortify17kmmrCommandType;
}
