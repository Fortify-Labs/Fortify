import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { HelmChart } from "../../constructs/helmChart";

export class PrometheusChart extends Chart {
	constructor(scope: Construct, ns: string, props?: ChartProps) {
		super(scope, ns, props);

		// Prior to generating this chart, run:
		// - helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
		// - helm repo add stable https://kubernetes-charts.storage.googleapis.com/
		// - helm repo update

		new HelmChart(this, "helm", {
			chart: "prometheus-community/prometheus",
			releaseName: "prometheus",
			values: {
				alertmanager: {
					enabled: true,
					persistentVolume: {
						enabled: true,
						size: "1Gi",
					},
				},
				server: {
					enabled: true,
					persistentVolume: {
						enabled: true,
						size: "4Gi",
					},
					retention: "15d",
				},
				pushgateway: {
					enabled: true,

					persistentVolume: {
						enabled: false,
						size: "2Gi",
					},
				},
				// alertmanagerFiles: {
				// 	"alertmanager.yml": {
				// 		global: {},
				// 		receivers: [
				// 			{
				// 				name: "default-receiver",
				// 			},
				// 		],
				// 		route: {
				// 			group_wait: "10s",
				// 			group_interval: "5m",
				// 			receiver: "default-receiver",
				// 			repeat_interval: "3h",
				// 		},
				// 	},
				// },
				serverFiles: {
					"alerting_rules.yml": {},
					alerts: {},
					"recording_rules.yml": {},
					rules: {},
					"prometheus.yml": {
						rule_files: [
							"/etc/config/recording_rules.yml",
							"/etc/config/alerting_rules.yml",
							"/etc/config/rules",
							"/etc/config/alerts",
						],
						scrape_configs: [
							{
								job_name: "prometheus",
								static_configs: [
									{
										targets: ["localhost:9090"],
									},
								],
							},
							{
								job_name: "kubernetes-apiservers",
								kubernetes_sd_configs: [
									{
										role: "endpoints",
									},
								],
								scheme: "https",
								tls_config: {
									ca_file:
										"/var/run/secrets/kubernetes.io/serviceaccount/ca.crt",
									insecure_skip_verify: true,
								},
								bearer_token_file:
									"/var/run/secrets/kubernetes.io/serviceaccount/token",
								relabel_configs: [
									{
										source_labels: [
											"__meta_kubernetes_namespace",
											"__meta_kubernetes_service_name",
											"__meta_kubernetes_endpoint_port_name",
										],
										action: "keep",
										regex: "default;kubernetes;https",
									},
								],
							},
							{
								job_name: "kubernetes-nodes",
								scheme: "https",
								tls_config: {
									ca_file:
										"/var/run/secrets/kubernetes.io/serviceaccount/ca.crt",
									insecure_skip_verify: true,
								},
								bearer_token_file:
									"/var/run/secrets/kubernetes.io/serviceaccount/token",
								kubernetes_sd_configs: [
									{
										role: "node",
									},
								],
								relabel_configs: [
									{
										action: "labelmap",
										regex:
											"__meta_kubernetes_node_label_(.+)",
									},
									{
										target_label: "__address__",
										replacement:
											"kubernetes.default.svc:443",
									},
									{
										source_labels: [
											"__meta_kubernetes_node_name",
										],
										regex: "(.+)",
										target_label: "__metrics_path__",
										replacement:
											"/api/v1/nodes/$1/proxy/metrics",
									},
								],
							},
							{
								job_name: "kubernetes-nodes-cadvisor",
								scheme: "https",
								tls_config: {
									ca_file:
										"/var/run/secrets/kubernetes.io/serviceaccount/ca.crt",
									insecure_skip_verify: true,
								},
								bearer_token_file:
									"/var/run/secrets/kubernetes.io/serviceaccount/token",
								kubernetes_sd_configs: [
									{
										role: "node",
									},
								],
								relabel_configs: [
									{
										action: "labelmap",
										regex:
											"__meta_kubernetes_node_label_(.+)",
									},
									{
										target_label: "__address__",
										replacement:
											"kubernetes.default.svc:443",
									},
									{
										source_labels: [
											"__meta_kubernetes_node_name",
										],
										regex: "(.+)",
										target_label: "__metrics_path__",
										replacement:
											"/api/v1/nodes/$1/proxy/metrics/cadvisor",
									},
								],
							},
							{
								job_name: "kubernetes-service-endpoints",
								kubernetes_sd_configs: [
									{
										role: "endpoints",
									},
								],
								relabel_configs: [
									{
										source_labels: [
											"__meta_kubernetes_service_annotation_prometheus_io_scrape",
										],
										action: "keep",
										regex: true,
									},
									{
										source_labels: [
											"__meta_kubernetes_service_annotation_prometheus_io_scheme",
										],
										action: "replace",
										target_label: "__scheme__",
										regex: "(https?)",
									},
									{
										source_labels: [
											"__meta_kubernetes_service_annotation_prometheus_io_path",
										],
										action: "replace",
										target_label: "__metrics_path__",
										regex: "(.+)",
									},
									{
										source_labels: [
											"__address__",
											"__meta_kubernetes_service_annotation_prometheus_io_port",
										],
										action: "replace",
										target_label: "__address__",
										regex: "([^:]+)(?::\\d+)?;(\\d+)",
										replacement: "$1:$2",
									},
									{
										action: "labelmap",
										regex:
											"__meta_kubernetes_service_label_(.+)",
									},
									{
										source_labels: [
											"__meta_kubernetes_namespace",
										],
										action: "replace",
										target_label: "kubernetes_namespace",
									},
									{
										source_labels: [
											"__meta_kubernetes_service_name",
										],
										action: "replace",
										target_label: "kubernetes_name",
									},
									{
										source_labels: [
											"__meta_kubernetes_pod_node_name",
										],
										action: "replace",
										target_label: "kubernetes_node",
									},
								],
							},
							{
								job_name: "kubernetes-service-endpoints-slow",
								scrape_interval: "5m",
								scrape_timeout: "30s",
								kubernetes_sd_configs: [
									{
										role: "endpoints",
									},
								],
								relabel_configs: [
									{
										source_labels: [
											"__meta_kubernetes_service_annotation_prometheus_io_scrape_slow",
										],
										action: "keep",
										regex: true,
									},
									{
										source_labels: [
											"__meta_kubernetes_service_annotation_prometheus_io_scheme",
										],
										action: "replace",
										target_label: "__scheme__",
										regex: "(https?)",
									},
									{
										source_labels: [
											"__meta_kubernetes_service_annotation_prometheus_io_path",
										],
										action: "replace",
										target_label: "__metrics_path__",
										regex: "(.+)",
									},
									{
										source_labels: [
											"__address__",
											"__meta_kubernetes_service_annotation_prometheus_io_port",
										],
										action: "replace",
										target_label: "__address__",
										regex: "([^:]+)(?::\\d+)?;(\\d+)",
										replacement: "$1:$2",
									},
									{
										action: "labelmap",
										regex:
											"__meta_kubernetes_service_label_(.+)",
									},
									{
										source_labels: [
											"__meta_kubernetes_namespace",
										],
										action: "replace",
										target_label: "kubernetes_namespace",
									},
									{
										source_labels: [
											"__meta_kubernetes_service_name",
										],
										action: "replace",
										target_label: "kubernetes_name",
									},
									{
										source_labels: [
											"__meta_kubernetes_pod_node_name",
										],
										action: "replace",
										target_label: "kubernetes_node",
									},
								],
							},
							{
								job_name: "prometheus-pushgateway",
								honor_labels: true,
								kubernetes_sd_configs: [
									{
										role: "service",
									},
								],
								relabel_configs: [
									{
										source_labels: [
											"__meta_kubernetes_service_annotation_prometheus_io_probe",
										],
										action: "keep",
										regex: "pushgateway",
									},
								],
							},
							{
								job_name: "kubernetes-services",
								metrics_path: "/probe",
								params: {
									module: ["http_2xx"],
								},
								kubernetes_sd_configs: [
									{
										role: "service",
									},
								],
								relabel_configs: [
									{
										source_labels: [
											"__meta_kubernetes_service_annotation_prometheus_io_probe",
										],
										action: "keep",
										regex: true,
									},
									{
										source_labels: ["__address__"],
										target_label: "__param_target",
									},
									{
										target_label: "__address__",
										replacement: "blackbox",
									},
									{
										source_labels: ["__param_target"],
										target_label: "instance",
									},
									{
										action: "labelmap",
										regex:
											"__meta_kubernetes_service_label_(.+)",
									},
									{
										source_labels: [
											"__meta_kubernetes_namespace",
										],
										target_label: "kubernetes_namespace",
									},
									{
										source_labels: [
											"__meta_kubernetes_service_name",
										],
										target_label: "kubernetes_name",
									},
								],
							},
							{
								job_name: "kubernetes-pods",
								kubernetes_sd_configs: [
									{
										role: "pod",
									},
								],
								relabel_configs: [
									{
										source_labels: [
											"__meta_kubernetes_pod_annotation_prometheus_io_scrape",
										],
										action: "keep",
										regex: true,
									},
									{
										source_labels: [
											"__meta_kubernetes_pod_annotation_prometheus_io_path",
										],
										action: "replace",
										target_label: "__metrics_path__",
										regex: "(.+)",
									},
									{
										source_labels: [
											"__address__",
											"__meta_kubernetes_pod_annotation_prometheus_io_port",
										],
										action: "replace",
										regex: "([^:]+)(?::\\d+)?;(\\d+)",
										replacement: "$1:$2",
										target_label: "__address__",
									},
									{
										action: "labelmap",
										regex:
											"__meta_kubernetes_pod_label_(.+)",
									},
									{
										source_labels: [
											"__meta_kubernetes_namespace",
										],
										action: "replace",
										target_label: "kubernetes_namespace",
									},
									{
										source_labels: [
											"__meta_kubernetes_pod_name",
										],
										action: "replace",
										target_label: "kubernetes_pod_name",
									},
									{
										source_labels: [
											"__meta_kubernetes_pod_phase",
										],
										regex: "Pending|Succeeded|Failed",
										action: "drop",
									},
								],
								scrape_interval: "30s",
								scrape_timeout: "10s",
							},
							{
								job_name: "kubernetes-pods-slow",
								scrape_interval: "5m",
								scrape_timeout: "30s",
								kubernetes_sd_configs: [
									{
										role: "pod",
									},
								],
								relabel_configs: [
									{
										source_labels: [
											"__meta_kubernetes_pod_annotation_prometheus_io_scrape_slow",
										],
										action: "keep",
										regex: true,
									},
									{
										source_labels: [
											"__meta_kubernetes_pod_annotation_prometheus_io_path",
										],
										action: "replace",
										target_label: "__metrics_path__",
										regex: "(.+)",
									},
									{
										source_labels: [
											"__address__",
											"__meta_kubernetes_pod_annotation_prometheus_io_port",
										],
										action: "replace",
										regex: "([^:]+)(?::\\d+)?;(\\d+)",
										replacement: "$1:$2",
										target_label: "__address__",
									},
									{
										action: "labelmap",
										regex:
											"__meta_kubernetes_pod_label_(.+)",
									},
									{
										source_labels: [
											"__meta_kubernetes_namespace",
										],
										action: "replace",
										target_label: "kubernetes_namespace",
									},
									{
										source_labels: [
											"__meta_kubernetes_pod_name",
										],
										action: "replace",
										target_label: "kubernetes_pod_name",
									},
									{
										source_labels: [
											"__meta_kubernetes_pod_phase",
										],
										regex: "Pending|Succeeded|Failed",
										action: "drop",
									},
								],
							},
							{
								job_name: "grafana",
								scrape_interval: "30s",
								static_configs: [
									{
										targets: ["grafana:80"],
									},
								],
							},
						],
					},
				},
			},
		});
	}
}
