import { Construct } from "constructs";
import { Ingress, Secret } from "../../imports/k8s";

const { ENVIRONMENT = "prod", CLUSTER_BASIC_AUTH = "" } = process.env;

export interface ClusterIngressOptions {
	readonly name: string;
	readonly namespace: string;
	readonly serviceName: string;
	readonly servicePort: number;

	readonly host?: string;

	readonly basicAuth?: boolean;
}

export class ClusterIngress extends Construct {
	constructor(scope: Construct, ns: string, options: ClusterIngressOptions) {
		super(scope, ns);

		const {
			name,
			host = `${name}-${ENVIRONMENT}.fortify.dev`,
			namespace,
			serviceName,
			servicePort,
			basicAuth = true,
		} = options;

		let annotations = {};

		if (basicAuth) {
			const basicAuthSecret = new Secret(this, "basic-auth", {
				type: "Opaque",
				metadata: {
					name: "basic-auth",
					namespace,
				},
				stringData: {
					auth: CLUSTER_BASIC_AUTH,
				},
			});

			annotations = {
				// # type of authentication
				"nginx.ingress.kubernetes.io/auth-type": "basic",
				// # name of the secret that contains the user/password definitions
				"nginx.ingress.kubernetes.io/auth-secret": basicAuthSecret.name,
				// # message to display with an appropriate context why the authentication is required
				"nginx.ingress.kubernetes.io/auth-realm":
					"Authentication Required",
			};
		}

		new Ingress(this, `${name}-${ENVIRONMENT}-ingress`, {
			metadata: {
				name: `${name}-${ENVIRONMENT}-ingress`,
				namespace,
				annotations,
			},
			spec: {
				rules: [
					{
						host: host,
						http: {
							paths: [
								{
									backend: {
										serviceName,
										servicePort,
									},
								},
							],
						},
					},
				],
			},
		});
	}
}
