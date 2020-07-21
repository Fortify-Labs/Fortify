export interface FortifyScript {
	name: string;

	handler: () => Promise<unknown> | unknown;
}
