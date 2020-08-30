import { Construct } from "constructs";
import { IngressRoute } from "../../imports/traefik.containo.us/ingressroute";

const { ENVIRONMENT = "prod" } = process.env;

export interface ClusterIngressOptions {
	readonly name: string;
	readonly namespace: string;
	readonly serviceName: string;
	readonly servicePort: number;

	readonly host?: string;

	readonly basicAuth?: boolean;
}

export class ClusterIngressTraefik extends Construct {
	constructor(scope: Construct, ns: string, options: ClusterIngressOptions) {
		super(scope, ns);

		const {
			name,
			host = `${name}-${ENVIRONMENT}.fortify.dev`,
			serviceName,
			servicePort,
			namespace,
			basicAuth = true,
		} = options;

		const middlewares: Record<string, unknown>[] = [
			{
				name: "redirect-scheme-middleware",
				namespace: "kube-system",
			},
		];

		if (basicAuth) {
			middlewares.push({
				name: "basic-auth",
				namespace: "kube-system",
			});
		}

		const entryPoints = ["web", "websecure"];

		new IngressRoute(this, `${name}-${ENVIRONMENT}-ingress-route`, {
			metadata: {
				name: `${name}-${ENVIRONMENT}-ingress-route`,
				namespace: "kube-system",
			},
			spec: {
				entryPoints,

				routes: [
					{
						match: `Host(\`${host}\`)`,
						kind: "Rule",
						middlewares,
						services: [
							{
								name: serviceName,
								namespace,
								port: servicePort,
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
