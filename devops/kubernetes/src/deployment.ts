import { Construct, Node } from "constructs";
import { Service, Deployment, EnvVar } from "../imports/k8s";

const { REGISTRY, VERSION } = process.env;

export interface FortifyDeploymentOptions {
	readonly name: string;

	// Override image incase image shall not be interpolated from name
	readonly image?: string;

	readonly replicas?: number;

	readonly service?: {
		name: string;
		port: number;
		containerPort: number;
	};

	readonly env?: EnvVar[] | undefined;
	readonly configmaps?: string[];
	readonly secrets?: string[];
}

export class FortifyDeployment extends Construct {
	constructor(
		scope: Construct,
		ns: string,
		options: FortifyDeploymentOptions
	) {
		super(scope, ns);

		const labels = { app: Node.of(this).uniqueId };

		const configmaps = options.configmaps ?? [];
		const secrets = options.secrets ?? [];

		const replicas = options.replicas ?? 1;

		if (options.service) {
			new Service(this, "service", {
				metadata: {
					name: options.service.name,
				},
				spec: {
					type: "ClusterIP",
					ports: [
						{
							port: options.service.port,
							targetPort: options.service.containerPort,
						},
					],
					selector: labels,
				},
			});
		}

		new Deployment(this, "deployment", {
			spec: {
				replicas,
				selector: {
					matchLabels: labels,
				},
				template: {
					metadata: { labels },
					spec: {
						containers: [
							{
								name: options.name,
								image:
									options.image ??
									(REGISTRY ?? "") +
										options.name +
										":" +
										(VERSION ?? "invalid"),
								ports: options.service
									? [
											{
												containerPort:
													options.service
														.containerPort,
											},
									  ]
									: [],
								envFrom: [
									...configmaps.map((name) => ({
										configMapRef: {
											name,
										},
									})),
									...secrets.map((name) => ({
										secretRef: {
											name,
										},
									})),
								],
								env: options.env,
							},
						],
					},
				},
			},
		});
	}
}