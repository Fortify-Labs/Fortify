import { Construct } from "constructs";
import { IngressRoute } from "../../../imports/traefik.containo.us";

import { FortifyDeploymentOptions, FortifyDeployment } from "./deployment";

export interface WebServiceOptions {
	readonly traefik?: {
		readonly entryPoints: string[];
		readonly match: string;
		readonly namespace: string;
		readonly basicAuth?: boolean;
	};
}

export class WebService extends Construct {
	constructor(
		scope: Construct,
		ns: string,
		options: FortifyDeploymentOptions & WebServiceOptions
	) {
		super(scope, ns);

		const { traefik, service } = options;

		new FortifyDeployment(this, "deployment", options);

		if (service) {
			if (traefik) {
				const {
					entryPoints,
					match,
					namespace,
					basicAuth = false,
				} = traefik;

				const middlewares = [
					{
						name: "compression",
						namespace: "kube-system",
					},
				];

				if (basicAuth) {
					middlewares.push({
						name: "basic-auth",
						namespace: "kube-system",
					});
				}

				new IngressRoute(this, "ingress-route", {
					metadata: {
						name: options.name + "-ingress-route",
						namespace: "kube-system",
					},
					spec: {
						entryPoints,
						routes: [
							{
								kind: "Rule",
								match,
								middlewares,
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
