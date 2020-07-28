import { Construct } from "constructs";
import { ConfigMap, Service, Deployment } from "../imports/k8s";

export interface RedisCommanderConfig {
	REDIS_HOST?: string;
	REDIS_PORT?: string;
}

export class RedisCommander extends Construct {
	constructor(scope: Construct, ns: string, config?: RedisCommanderConfig) {
		super(scope, ns);

		const labels = { app: "redis-commander" };

		const { REDIS_HOST = "redis", REDIS_PORT = "6379" } = config ?? {};

		new ConfigMap(this, "config", {
			metadata: {
				name: "redis-commander-config",
			},
			data: {
				REDIS_HOST,
				REDIS_PORT,
				K8S_SIGTERM: "1",
			},
		});

		new Service(this, "service", {
			metadata: {
				name: "redis-commander",
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

		new Deployment(this, "deployment", {
			metadata: {
				name: "redis-commander",
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
