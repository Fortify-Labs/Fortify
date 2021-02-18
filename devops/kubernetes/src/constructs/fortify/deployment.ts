import { Names } from "cdk8s";
import { Construct } from "constructs";
import {
	KubeService,
	KubeDeployment,
	EnvVar,
	KubePodDisruptionBudgetV1Beta1,
	KubeSecret,
	KubeConfigMap,
	Probe,
	ResourceRequirements,
} from "../../../imports/k8s";

const { REGISTRY } = process.env;

export interface FortifyDeploymentOptions {
	readonly name: string;

	readonly version?: string;

	/**
	 * Override image incase image shall not be interpolated from name
	 */
	readonly image?: string;

	readonly replicas?: number;

	readonly service?: {
		name: string;

		port: number;
		containerPort: number;
		portName: string;
	};

	readonly env?: EnvVar[] | undefined;
	readonly configmaps?: KubeConfigMap[];
	readonly secrets?: KubeSecret[];

	readonly minAvailable?: number;
	readonly maxUnavailable?: number;

	livenessProbe?: Probe | null;
	readinessProbe?: Probe | null;

	/**
	 * Compute Resources required by this container
	 *
	 * Defaults to:
	 * ```json
	 * {
	 *		limits: {
	 *			cpu: "0.2",
	 *			memory: "256Mi",
	 *		},
	 *		requests: {
	 *			cpu: "0.1",
	 *			memory: "128Mi",
	 *		}
	 *	}
	 *	```
	 */
	resources?: ResourceRequirements;

	/**
	 * Boolean wether prometheus scraper shall scrape for metrics
	 */
	metrics?: boolean;
}

export class FortifyDeployment extends Construct {
	constructor(
		scope: Construct,
		ns: string,
		options: FortifyDeploymentOptions
	) {
		super(scope, ns);

		const {
			resources = {
				limits: {
					cpu: "0.2",
					memory: "256Mi",
				},
				requests: {
					cpu: "0.1",
					memory: "128Mi",
				},
			},
		} = options;

		let { livenessProbe, readinessProbe, metrics = true } = options;

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
		if (livenessProbe === null) {
			livenessProbe = undefined;
		}
		if (readinessProbe === null) {
			readinessProbe = undefined;
		}

		const selectorLabels = {
			app: Names.toDnsLabel(this),
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

		if (!env.find((envvar) => envvar.name === "NODE_ENV")) {
			env.push({
				name: "NODE_ENV",
				value: "production",
			});
		}

		const image =
			options.image ??
			(REGISTRY ?? "") +
				options.name +
				":" +
				(options.version ?? "invalid");

		if (options.service) {
			new KubeService(this, "service", {
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

		new KubeDeployment(this, "deployment", {
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
					metadata: {
						annotations: metrics
							? {
									"prometheus.io/scrape": "true",
									"prometheus.io/port": "8000",
									"prometheus.io/path": "/metrics",
							  }
							: undefined,
						labels,
					},
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
								livenessProbe,
								readinessProbe,
								resources,
							},
						],
					},
				},
			},
		});

		if (options.minAvailable || options.maxUnavailable) {
			new KubePodDisruptionBudgetV1Beta1(this, "pdb", {
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
