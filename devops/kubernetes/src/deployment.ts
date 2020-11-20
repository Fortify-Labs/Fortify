import { Construct, Node } from "constructs";
import {
	Service,
	Deployment,
	EnvVar,
	PodDisruptionBudget,
	Secret,
	ConfigMap,
	Probe,
} from "../imports/k8s";

const { REGISTRY } = process.env;

export interface FortifyDeploymentOptions {
	readonly name: string;

	readonly version?: string;

	// Override image incase image shall not be interpolated from name
	readonly image?: string;

	readonly replicas?: number;

	readonly service?: {
		name: string;

		port: number;
		containerPort: number;
		portName: string;
	};

	readonly env?: EnvVar[] | undefined;
	readonly configmaps?: ConfigMap[];
	readonly secrets?: Secret[];

	readonly minAvailable?: number;
	readonly maxUnavailable?: number;

	livenessProbe?: Probe | null;
	readinessProbe?: Probe | null;
}

export class FortifyDeployment extends Construct {
	constructor(
		scope: Construct,
		ns: string,
		options: FortifyDeploymentOptions
	) {
		super(scope, ns);

		let { livenessProbe, readinessProbe } = options;

		if (livenessProbe === undefined) {
			livenessProbe = {
				httpGet: {
					path: "/live",
					port: 9000,
				},
				initialDelaySeconds: 5,
				periodSeconds: 10,
			};
		}
		if (readinessProbe === undefined) {
			readinessProbe = {
				httpGet: {
					path: "/ready",
					port: 9000,
				},
				initialDelaySeconds: 5,
				periodSeconds: 10,
			};
		}

		const selectorLabels = {
			app: Node.of(this).uniqueId,
		};
		const labels = {
			...selectorLabels,
			version: options.version ?? "invalidVersion",
		};

		const configmaps = options.configmaps ?? [];
		const secrets = options.secrets ?? [];

		const replicas = options.replicas ?? 1;

		const env: EnvVar[] = options.env
			? [...options.env, { name: "DEBUG", value: "app::*" }]
			: [];

		// env.push({ name: "ENVOY_ADMIN_API", value: "http://127.0.0.1:15000" });

		const image =
			options.image ??
			(REGISTRY ?? "") +
				options.name +
				":" +
				(options.version ?? "invalid");

		if (options.service) {
			new Service(this, "service", {
				metadata: {
					name: options.service.name,
				},
				spec: {
					type: "ClusterIP",
					ports: [
						{
							name: options.service.portName,
							port: options.service.port,
							targetPort: options.service.containerPort,
						},
					],
					selector: selectorLabels,
				},
			});
		}

		new Deployment(this, "deployment", {
			metadata: {
				name: options.name + "-deployment",
			},
			spec: {
				replicas,
				selector: {
					matchLabels: selectorLabels,
				},
				revisionHistoryLimit: 3,
				template: {
					metadata: { labels },
					spec: {
						containers: [
							{
								name: options.name,
								image,
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
									...configmaps.map(({ name }) => ({
										configMapRef: {
											name,
										},
									})),
									...secrets.map(({ name }) => ({
										secretRef: {
											name,
										},
									})),
								],
								env,
								livenessProbe: livenessProbe || undefined,
								readinessProbe: readinessProbe || undefined,
							},
						],
					},
				},
			},
		});

		if (options.minAvailable || options.maxUnavailable) {
			new PodDisruptionBudget(this, "pdb", {
				metadata: {
					name: options.name + "-pdb",
				},
				spec: {
					selector: {
						matchLabels: labels,
					},
					maxUnavailable: options.maxUnavailable,
					minAvailable: options.minAvailable,
				},
			});
		}
	}
}
