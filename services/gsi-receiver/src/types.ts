// TODO: Turn this into a shared library

export enum Scope {
	GSI_INGRESS,
}

export interface Context {
	user: {
		id: string;
	};

	scopes: ReadonlyArray<Scope>;
}
