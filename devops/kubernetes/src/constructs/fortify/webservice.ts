import { Construct } from "constructs";
import { IngressRoute } from "../../../imports/traefik.containo.us";

import { FortifyDeploymentOptions, FortifyDeployment } from "./deployment";

export interface WebServiceOptions {
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

		const { traefik, service } = options;

		new FortifyDeployment(this, "deployment", options);

		if (service) {
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
										name: "compression",
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
