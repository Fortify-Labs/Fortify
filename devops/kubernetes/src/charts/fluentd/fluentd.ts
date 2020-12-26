import { Construct, ConstructOptions } from "constructs";
import { resolve } from "path";
import { readFileSync, readdirSync } from "fs";
import {
	KubeServiceAccount,
	KubeClusterRole,
	KubeClusterRoleBinding,
	KubeConfigMap,
	KubeDaemonSet,
} from "../../../imports/k8s";

export class FluentdConstruct extends Construct {
	constructor(scope: Construct, id: string, options?: ConstructOptions) {
		super(scope, id, options);

		new KubeServiceAccount(this, "service-account", {
			metadata: {
				name: "fluentd",
				namespace: "logs",
			},
		});

		new KubeClusterRole(this, "cluster-role", {
			metadata: {
				name: "fluentd",
				namespace: "logs",
			},
			rules: [
				{
					apiGroups: [""],
					resources: ["pods", "namespaces"],
					verbs: ["get", "list", "watch"],
				},
			],
		});

		new KubeClusterRoleBinding(this, "cluster-role-binding", {
			metadata: {
				name: "fluentd",
			},
			roleRef: {
				kind: "ClusterRole",
				name: "fluentd",
				apiGroup: "rbac.authorization.k8s.io",
			},
			subjects: [
				{
					kind: "ServiceAccount",
					name: "fluentd",
					namespace: "logs",
				},
			],
		});

		const directory = `${resolve(__dirname)}/configs/`;

		// TODO: Rework this to recursively support nested directories in configs (e.g. conf.d folder containing configs)
		new KubeConfigMap(this, "configs", {
			metadata: {
				name: "fluentd-configs",
				namespace: "logs",
			},
			binaryData: readdirSync(directory).reduce<Record<string, string>>(
				(acc, file) => {
					acc[file] = readFileSync(directory + file, {
						encoding: "base64",
					});

					return acc;
				},
				{}
			),
		});

		new KubeDaemonSet(this, "daemon-set", {
			metadata: {
				name: "fluentd",
				namespace: "logs",
				labels: {
					"k8s-app": "fluentd-logging",
					version: "v1",
				},
			},
			spec: {
				selector: {
					matchLabels: {
						"k8s-app": "fluentd-logging",
						version: "v1",
					},
				},
				template: {
					metadata: {
						labels: {
							"k8s-app": "fluentd-logging",
							version: "v1",
						},
					},
					spec: {
						serviceAccount: "fluentd",
						serviceAccountName: "fluentd",
						tolerations: [
							{
								key: "node-role.kubernetes.io/master",
								effect: "NoSchedule",
							},
						],
						containers: [
							{
								name: "fluentd",
								image:
									"fluent/fluentd-kubernetes-daemonset:v1-debian-elasticsearch",
								env: [
									{
										name: "FLUENT_ELASTICSEARCH_HOST",
										value: "elasticsearch-es-http",
									},
									{
										name: "FLUENT_ELASTICSEARCH_PORT",
										value: "9200",
									},
									{
										name: "FLUENT_ELASTICSEARCH_SCHEME",
										value: "http",
									},
									// Option to configure elasticsearch plugin with self signed certs
									{
										name: "FLUENT_ELASTICSEARCH_SSL_VERIFY",
										value: "true",
									},
									// Option to configure elasticsearch plugin with tls
									{
										name:
											"FLUENT_ELASTICSEARCH_SSL_VERSION",
										value: "TLSv1_2",
									},
									// X-Pack Authentication
									{
										name: "FLUENT_ELASTICSEARCH_USER",
										value: "elastic",
									},
									{
										name: "FLUENT_ELASTICSEARCH_PASSWORD",
										valueFrom: {
											secretKeyRef: {
												key: "elastic",
												name:
													"elasticsearch-es-elastic-user",
											},
										},
									},
								],
								resources: {
									limits: {
										memory: "400Mi",
									},
									requests: {
										cpu: "100m",
										memory: "400Mi",
									},
								},
								volumeMounts: [
									{
										name: "varlog",
										mountPath: "/var/log",
									},
									{
										name: "varlibdockercontainers",
										mountPath: "/var/lib/docker/containers",
										readOnly: true,
									},
									{
										name: "fluentd-configs",
										mountPath: "/fluentd/etc",
									},
								],
							},
						],
						terminationGracePeriodSeconds: 30,
						volumes: [
							{
								name: "varlog",
								hostPath: {
									path: "/var/log",
								},
							},
							{
								name: "varlibdockercontainers",
								hostPath: {
									path: "/var/lib/docker/containers",
								},
							},
							{
								name: "fluentd-configs",
								configMap: {
									name: "fluentd-configs",
								},
							},
						],
					},
				},
			},
		});
	}
}
