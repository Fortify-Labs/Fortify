import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import {
	KubeClusterRole,
	KubeClusterRoleBinding,
	KubeDeployment,
	KubeServiceAccount,
} from "../../../imports/k8s";

export class RedisOperatorChart extends Chart {
	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, props);

		new KubeDeployment(this, "deployment", {
			metadata: {
				labels: {
					app: "redisoperator",
				},
				name: "redisoperator",
			},
			spec: {
				replicas: 1,
				selector: {
					matchLabels: {
						app: "redisoperator",
					},
				},
				strategy: {
					type: "RollingUpdate",
				},
				template: {
					metadata: {
						labels: {
							app: "redisoperator",
						},
					},
					spec: {
						serviceAccountName: "redisoperator",
						containers: [
							{
								image:
									"quay.io/spotahome/redis-operator:latest",
								imagePullPolicy: "IfNotPresent",
								name: "app",
								securityContext: {
									readOnlyRootFilesystem: true,
									runAsNonRoot: true,
									runAsUser: 1000,
								},
								resources: {
									limits: {
										cpu: "100m",
										memory: "50Mi",
									},
									requests: {
										cpu: "10m",
										memory: "50Mi",
									},
								},
							},
						],
						restartPolicy: "Always",
					},
				},
			},
		});

		new KubeClusterRoleBinding(this, "crb", {
			metadata: {
				name: "redisoperator",
			},
			roleRef: {
				apiGroup: "rbac.authorization.k8s.io",
				kind: "ClusterRole",
				name: "redisoperator",
			},
			subjects: [
				{
					kind: "ServiceAccount",
					name: "redisoperator",
					namespace: "redis",
				},
			],
		});

		new KubeClusterRole(this, "cr", {
			metadata: {
				name: "redisoperator",
			},
			rules: [
				{
					apiGroups: ["databases.spotahome.com"],
					resources: ["redisfailovers"],
					verbs: ["*"],
				},
				{
					apiGroups: ["apiextensions.k8s.io"],
					resources: ["customresourcedefinitions"],
					verbs: ["*"],
				},
				{
					apiGroups: [""],
					resources: [
						"pods",
						"services",
						"endpoints",
						"events",
						"configmaps",
					],
					verbs: ["*"],
				},
				{
					apiGroups: [""],
					resources: ["secrets"],
					verbs: ["get"],
				},
				{
					apiGroups: ["apps"],
					resources: ["deployments", "statefulsets"],
					verbs: ["*"],
				},
				{
					apiGroups: ["policy"],
					resources: ["poddisruptionbudgets"],
					verbs: ["*"],
				},
			],
		});

		new KubeServiceAccount(this, "sa", {
			metadata: {
				name: "redisoperator",
			},
		});
	}
}
