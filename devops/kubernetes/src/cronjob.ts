import { Construct } from "constructs";
import { CronJob, EnvVar } from "../imports/k8s";

const { REGISTRY, JOBS_SENTRY_DSN } = process.env;

export interface FortifyCronJobOptions {
	readonly schedule: string;
	readonly script: string;

	readonly name: string;
	readonly version: string;

	// absolute image name
	readonly image?: string;
	// only the image name, registry and version will be added
	// will only be used when image variable is not set
	readonly imageName?: string;

	readonly env?: EnvVar[] | undefined;
	readonly configmaps?: string[];
	readonly secrets?: string[];
}

export class FortifyCronJob extends Construct {
	constructor(scope: Construct, ns: string, options: FortifyCronJobOptions) {
		super(scope, ns);

		const configmaps = options.configmaps ?? [];
		const secrets = options.secrets ?? [];
		const env: EnvVar[] = options.env
			? [...options.env, { name: "DEBUG", value: "app::*" }]
			: [];

		// env.push({ name: "ENVOY_ADMIN_API", value: "http://127.0.0.1:15000" });
		// env.push({ name: "ISTIO_QUIT_API", value: "http://127.0.0.1:15020" });

		env.push({
			name: "SENTRY_DSN",
			value: JOBS_SENTRY_DSN,
		});

		const image =
			options.image ??
			(REGISTRY ?? "") +
				(options.imageName ?? "jobs") +
				":" +
				(options.version ?? "invalid");

		new CronJob(this, "cronjob", {
			metadata: {
				name: options.name,
			},
			spec: {
				schedule: options.schedule,
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
										command: [
											// "scuttle",
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
