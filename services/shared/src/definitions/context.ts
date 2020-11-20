export enum PermissionScope {
	Admin = "ADMIN",
	User = "USER",
	GsiIngress = "GSI_INGRESS",
	Unknown = "UNKNOWN",
}

export interface Context {
	user: {
		id: string;
	};

	scopes: ReadonlyArray<PermissionScope>;
}
