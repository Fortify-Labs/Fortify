import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import {
	KubeServiceAccount,
	KubeRole,
	KubeRoleBinding,
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

		new KubeRole(this, "role", {
			metadata: {
				name: "cicd-user-role",
				namespace: "fortify",
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

		new KubeRoleBinding(this, "role-binding", {
			metadata: {
				name: "cicd-user-global-rolebinding",
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
				kind: "Role",
				name: "cicd-user-role",
				apiGroup: "rbac.authorization.k8s.io",
			},
		});
	}
}
