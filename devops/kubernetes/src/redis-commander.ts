import { Construct } from "constructs";
import { KubeConfigMap, KubeService, KubeDeployment } from "../imports/k8s";

export interface RedisCommanderConfig {
	REDIS_HOST?: string;
	REDIS_PORT?: string;

	SENTINEL_HOST?: string;
	SENTINEL_PORT?: string;

	namespace?: string;
}

export class RedisCommander extends Construct {
	constructor(scope: Construct, ns: string, config?: RedisCommanderConfig) {
		super(scope, ns);

		const labels = { app: "redis-commander" };

		const {
			REDIS_HOST,
			REDIS_PORT,
			SENTINEL_HOST,
			SENTINEL_PORT,
			namespace,
		} = config ?? {};

		new KubeConfigMap(this, "config", {
			metadata: {
				name: "redis-commander-config",
				namespace,
			},
			data: {
				...(REDIS_HOST ? { REDIS_HOST } : {}),
				...(REDIS_PORT ? { REDIS_PORT } : {}),
				...(SENTINEL_HOST ? { SENTINEL_HOST } : {}),
				...(SENTINEL_PORT ? { SENTINEL_PORT } : {}),
				K8S_SIGTERM: "1",
			},
		});

		new KubeService(this, "KubeService", {
			metadata: {
				name: "redis-commander",
				namespace,
			},
			spec: {
				selector: labels,
				type: "ClusterIP",
				ports: [
					{
						name: "http",
						port: 80,
						targetPort: 8081,
					},
				],
			},
		});

		new KubeDeployment(this, "KubeDeployment", {
			metadata: {
				name: "redis-commander",
				namespace,
			},
			spec: {
				replicas: 1,
				selector: {
					matchLabels: labels,
				},
				template: {
					metadata: {
						labels,
					},
					spec: {
						containers: [
							{
								name: "redis-commander",
								image: "rediscommander/redis-commander",
								envFrom: [
									{
										configMapRef: {
											name: "redis-commander-config",
										},
									},
								],
								ports: [
									{
										name: "redis-commander",
										containerPort: 8081,
									},
								],
								resources: {
									limits: {
										cpu: "500m",
										memory: "512M",
									},
								},
								securityContext: {
									runAsNonRoot: true,
									readOnlyRootFilesystem: false,
									allowPrivilegeEscalation: false,
									capabilities: {
										drop: ["ALL"],
									},
								},
							},
						],
					},
				},
			},
		});
	}
}
