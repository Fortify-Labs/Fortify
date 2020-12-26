export interface Connector {
	connect(): Promise<unknown>;
}
