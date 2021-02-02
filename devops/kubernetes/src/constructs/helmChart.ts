import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

import { App, Chart, HelmProps, Names } from "cdk8s";
import { Construct, ConstructOptions, Node } from "constructs";
import { stripIndents } from "common-tags";

export class HelmChart extends Construct {
  constructor(
    scope: Construct,
    id: string,
    options?: ConstructOptions & HelmProps
  ) {
    super(scope, id, options);

    const app = Node.of(this).root;

    const { namespace } = Chart.of(this);

    if (app instanceof App && options) {
      const workDir = path.join(process.cwd() + "/" + app.outdir);

      fs.mkdirSync(workDir, { recursive: true });

      const releaseName =
        options.releaseName ??
        Names.toDnsLabel(scope, { extra: [id], maxLen: 53 });

      const valuesYaml = `values-${releaseName}.yaml`;
      const valuesPath = path.join(workDir, valuesYaml);

      fs.writeFileSync(
        valuesPath,
        // prettier-ignore
        stripIndents`
          # Helm override values for chart "${options.chart}", release: "${releaseName}"
          # Install using: helm install ${releaseName} ${options.chart} -f ./${app.outdir}/${valuesYaml} ${namespace ? `--create-namespace -n ${namespace}` : ""}
          # Upgrade using: helm upgrade ${releaseName} ${options.chart} -f ./${app.outdir}/${valuesYaml} ${namespace ? `-n ${namespace}` : ""}
        ` + "\n" + yaml.stringify(options.values)
      );
    }
  }
}
