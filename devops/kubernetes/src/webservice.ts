import { Construct } from "constructs";

import { FortifyDeploymentOptions, FortifyDeployment } from "./deployment";
import {
	VirtualService,
	VirtualServiceSpecHttp,
} from "../imports/networking.istio.io/virtualservice";

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
			spec: {
				hosts,
				gateways,
				http,
			},
		});
	}
}
