import { Chart, ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { KubeConfigMap } from "../../../imports/k8s";
import { HelmChart } from "../../constructs/helmChart";

const {
	S3_ENDPOINT = "",
	S3_REGION = "",
	S3_ACCESS_KEY_ID = "",
	S3_SECRET_ACCESS_KEY = "",
} = process.env;

export class PostgresOperator extends Chart {
	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, props);

		new HelmChart(this, "postgres-operator", {
			chart:
				"https://github.com/zalando/postgres-operator/raw/master/charts/postgres-operator/postgres-operator-1.6.0.tgz",
			releaseName: "postgres-operator",
			values: {
				enableJsonLogging: true,
				configKubernetes: {
					enable_pod_antiaffinity: "true",
					enable_pod_disruption_budget: "false",
					pod_environment_configmap: "postgres-pod-config",
				},
				configAwsOrGcp: {
					aws_region: S3_REGION,
					aws_endpoint: S3_ENDPOINT,
					wal_s3_bucket: "fortify-backups",
				},
				configLogicalBackup: {
					logical_backup_docker_image:
						"registry.opensource.zalan.do/acid/logical-backup:v1.6.0",
					logical_backup_job_prefix: "logical-backup-",
					logical_backup_provider: "s3",
					logical_backup_s3_access_key_id: S3_ACCESS_KEY_ID,
					logical_backup_s3_bucket: "fortify-backups",
					logical_backup_s3_endpoint: S3_ENDPOINT,
					logical_backup_s3_region: S3_REGION,
					logical_backup_s3_secret_access_key: S3_SECRET_ACCESS_KEY,
					logical_backup_s3_sse: "",
					logical_backup_schedule: "30 00 * * *",
				},
			},
		});

		new KubeConfigMap(this, "config", {
			metadata: {
				name: "postgres-pod-config",
			},
			data: {
				BACKUP_SCHEDULE: "0 */12 * * *",
				USE_WALG_BACKUP: "true",
				USE_WALG_RESTORE: "true",
				BACKUP_NUM_TO_RETAIN: "14",
				AWS_ACCESS_KEY_ID: S3_ACCESS_KEY_ID,
				AWS_SECRET_ACCESS_KEY: S3_SECRET_ACCESS_KEY,
				AWS_ENDPOINT: S3_ENDPOINT,
				AWS_REGION: S3_REGION,
				WALG_DISABLE_S3_SSE: "true",
			},
		});
	}
}
