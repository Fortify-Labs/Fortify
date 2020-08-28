import { Construct } from "constructs";

import { FortifyDeploymentOptions, FortifyDeployment } from "./deployment";
import {
	VirtualService,
	VirtualServiceSpecHttp,
	VirtualServiceOptions,
} from "../imports/networking.istio.io/virtualservice";
import { ObjectMeta } from "../imports/k8s";
import { IngressRoute } from "../imports/traefik.containo.us/ingressroute";

export interface CustomVirtualServiceOptions extends VirtualServiceOptions {
	metadata?: ObjectMeta;
}

export interface WebServiceOptions {
	readonly istio?: {
		readonly hosts: string[];
		readonly gateways: string[];
		readonly http: VirtualServiceSpecHttp[];
	};

	readonly traefik?: {
		readonly entryPoints: string[];
		readonly match: string;
		readonly namespace: string;
	};
}

export class WebService extends Construct {
	constructor(
		scope: Construct,
		ns: string,
		options: FortifyDeploymentOptions & WebServiceOptions
	) {
		super(scope, ns);

		const { istio, traefik, service } = options;

		new FortifyDeployment(this, "deployment", options);

		if (service) {
			if (istio) {
				const { hosts, gateways, http } = istio;
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

			if (traefik) {
				const { entryPoints, match, namespace } = traefik;

				new IngressRoute(this, "ingress-route", {
					metadata: {
						name: options.name + "-ingress-route",
						namespace: "kube-system",
					},
					spec: {
						entryPoints,

						routes: [
							{
								match: match,
								kind: "Rule",
								middlewares: [
									{
										name: "redirect-scheme-middleware",
										namespace: "kube-system",
									},
								],
								services: [
									{
										name: service.name,
										namespace,
										port: service.port,
									},
								],
							},
						],
						tls: {
							secretName: "fortify-cluster-ssl-cert",
						},
					},
				});
			}
		}
	}
}
