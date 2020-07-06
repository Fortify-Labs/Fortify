import { Construct } from "constructs";

import { FortifyDeploymentOptions, FortifyDeployment } from "./deployment";
import {
	VirtualService,
	VirtualServiceSpecHttp,
	VirtualServiceOptions,
} from "../imports/networking.istio.io/virtualservice";
import { ObjectMeta } from "../imports/k8s";

export interface CustomVirtualServiceOptions extends VirtualServiceOptions {
	metadata?: ObjectMeta;
}

export interface WebServiceOptions {
	readonly hosts: string[];
	readonly gateways: string[];
	readonly http: VirtualServiceSpecHttp[];
}

export class WebService extends Construct {
	constructor(
		scope: Construct,
		ns: string,
		options: FortifyDeploymentOptions & WebServiceOptions
	) {
		super(scope, ns);

		const { hosts, gateways, http } = options;

		new FortifyDeployment(this, "deployment", options);

		new VirtualService(this, "service", {
			metadata: {
				name: options.name + "-virtual-service",
			},
			spec: {
				hosts,
				gateways,
				http,
			},
		} as CustomVirtualServiceOptions);
	}
}
