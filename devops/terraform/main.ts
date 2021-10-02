import { Construct } from "constructs";
import { App, S3Backend, TerraformStack } from "cdktf";
import { ScalewayProvider } from "./.gen/providers/scaleway/scaleway-provider";
import { ObjectBucket } from "./.gen/providers/scaleway/object-bucket";
import { K8SCluster } from "./.gen/providers/scaleway/k8s-cluster";
import { K8SPool } from "./.gen/providers/scaleway/k8s-pool";

class FortifyStack extends TerraformStack {
	constructor(scope: Construct, name: string) {
		super(scope, name);

		// --- Provider ---
		new ScalewayProvider(this, "scw-provider", {
			region: "nl-ams",
			zone: "nl-ams-1",
		});

		// --- Defaults ---
		const tags = {
			cdktf_stack: "fortify",
		};

		// --- Resources ---
		new ObjectBucket(this, "bucket-backups", {
			name: "fortify-backups",
			tags,
		});
		new ObjectBucket(this, "bucket-replays", {
			name: "fortify-replays",
			tags,
		});

		const cluster = new K8SCluster(this, "k8s-cluster", {
			name: "fortify",
			description: "Kubernetes cluster for https://fortify.gg",
			cni: "weave",
			version: "1.20.4",
			tags: [JSON.stringify(tags)],
		});

		new K8SPool(this, "k8s-nodes", {
			name: "default",
			clusterId: cluster.id,
			nodeType: "DEV1_L",
			size: 3,
			minSize: 3,
			autohealing: true,
			autoscaling: false,
			containerRuntime: "docker",
			waitForPoolReady: true,
			tags: [JSON.stringify(tags)],
		});
	}
}

const app = new App();

const fortifyStack = new FortifyStack(app, "fortify");
const fortifyStackBackend = new S3Backend(fortifyStack, {
	bucket: "fortify-terraform-state",
	key: "fortify.tfstate",
	region: "nl-ams",
	endpoint: "https://s3.nl-ams.scw.cloud",
	skipCredentialsValidation: true,
});
fortifyStackBackend.addOverride("skip_region_validation", true);

app.synth();
