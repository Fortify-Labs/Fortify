import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import {
	KubeServiceAccount,
	KubeRoleBinding,
	KubeClusterRole,
} from "../../../imports/k8s";

export class CICDUser extends Chart {
	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, { ...props, namespace: "fortify" });

		new KubeServiceAccount(this, "service-account", {
			metadata: {
				name: "cicd-user",
			},
			automountServiceAccountToken: false,
		});

		new KubeClusterRole(this, "role", {
			metadata: {
				name: "cicd-user-role",
			},
			rules: [
				{
					apiGroups: ["", "apps", "extensions"],
					resources: [
						"deployments",
						"deployments/scale",
						"replicasets",
						"configmaps",
						"secrets",
						"services",
					],
					verbs: [
						"create",
						"update",
						"delete",
						"get",
						"watch",
						"patch",
						"list",
					],
				},
				{
					apiGroups: [""],
					resources: ["pods", "pods/status"],
					verbs: [
						"create",
						"delete",
						"list",
						"get",
						"watch",
						"patch",
					],
				},
				{
					apiGroups: ["batch"],
					resources: ["jobs", "cronjobs"],
					verbs: ["create", "delete", "list", "get", "patch"],
				},
				{
					apiGroups: ["policy"],
					resources: ["poddisruptionbudgets"],
					verbs: ["create", "delete", "list", "get", "patch"],
				},
				{
					apiGroups: [""],
					resources: ["namespaces"],
					verbs: ["*"],
				},
				{
					apiGroups: ["traefik.containo.us"],
					resources: ["ingressroutes"],
					verbs: ["create", "delete", "list", "get", "patch"],
				},
			],
		});

		new KubeRoleBinding(this, "role-binding-fortify", {
			metadata: {
				name: "cicd-user-fortify-rolebinding",
				namespace: "fortify",
			},
			subjects: [
				{
					kind: "ServiceAccount",
					name: "cicd-user",
					namespace: "fortify",
				},
			],
			roleRef: {
				apiGroup: "rbac.authorization.k8s.io",
				kind: "ClusterRole",
				name: "cicd-user-role",
			},
		});

		new KubeRoleBinding(this, "role-binding-kube-system", {
			metadata: {
				name: "cicd-user-kube-system-rolebinding",
				namespace: "kube-system",
			},
			subjects: [
				{
					kind: "ServiceAccount",
					name: "cicd-user",
					namespace: "fortify",
				},
			],
			roleRef: {
				apiGroup: "rbac.authorization.k8s.io",
				kind: "ClusterRole",
				name: "cicd-user-role",
			},
		});
	}
}
