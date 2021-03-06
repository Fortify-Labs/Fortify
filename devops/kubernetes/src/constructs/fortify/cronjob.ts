import { Construct } from "constructs";
import {
	KubeConfigMap,
	KubeCronJobV1Beta1,
	EnvVar,
	KubeSecret,
} from "../../../imports/k8s";

const { REGISTRY, JOBS_SENTRY_DSN } = process.env;

export interface FortifyCronJobOptions {
	readonly schedule: string;
	readonly script: string;

	readonly name: string;
	readonly version: string;

	/**
	 * absolute image name
	 */
	readonly image?: string;
	/**
	 * only the image name, registry and version will be added
	 * will only be used when image variable is not set
	 */
	readonly imageName?: string;

	readonly env?: EnvVar[] | undefined;
	readonly configmaps?: KubeConfigMap[];
	readonly secrets?: KubeSecret[];

	readonly suspend?: boolean;
}

export class FortifyCronJob extends Construct {
	constructor(scope: Construct, ns: string, options: FortifyCronJobOptions) {
		super(scope, ns);

		const configmaps = options.configmaps ?? [];
		const secrets = options.secrets ?? [];
		const env: EnvVar[] = options.env
			? [...options.env, { name: "DEBUG", value: "app::*" }]
			: [];

		env.push({
			name: "SENTRY_DSN",
			value: JOBS_SENTRY_DSN,
		});
		env.push({
			name: "PROMETHEUS_PUSH_GATEWAY",
			value: "http://prometheus-pushgateway.default:9091",
		});

		if (!env.find((envvar) => envvar.name === "NODE_ENV")) {
			env.push({
				name: "NODE_ENV",
				value: "production",
			});
		}

		const image =
			options.image ??
			(REGISTRY ?? "") +
				(options.imageName ?? "jobs") +
				":" +
				(options.version ?? "invalid");

		new KubeCronJobV1Beta1(this, "cronjob", {
			metadata: {
				name: options.name,
			},
			spec: {
				schedule: options.schedule,
				suspend: options.suspend ?? false,
				jobTemplate: {
					spec: {
						template: {
							spec: {
								containers: [
									{
										name: options.name,
										image,
										env,
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
										command: [
											"npm",
											"run",
											"start",
											"--",
											"run",
											options.script,
										],
									},
								],
								restartPolicy: "Never",
							},
						},
					},
				},
			},
		});
	}
}
