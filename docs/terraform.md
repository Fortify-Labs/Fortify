# Terraform

Fortify's infrastructure stack consists of a single, managed Kubernetes cluster and two S3 / object storage buckets.

The infrastructure is currently running at Scaleway in the NL-Amsterdam region.

## Build

Navigate to `devops/terraform`.

- Install all node dependencies run: `npm install`
- Synthesize Scaleway terraform provider to cdktf construct, run: `npm run get`

## Deploying a stack

### Authentication

Fill in the Scaleway access key and secret key and run the following commands in a shell.

```bash
export SCW_ACCESS_KEY=[...]
export SCW_SECRET_KEY=[...]

export AWS_ACCESS_KEY_ID=$SCW_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=$SCW_SECRET_KEY
```

This will setup the necessary env variables for terraform to be able to fetch the current remote state & provision infrastructure.

### Deploy via cdktf cli

From within the terraform directory ( `devops/terraform` ):

- Deploy the terraform stack: `cdktf deploy fortify`
- Once asked for review of the execution plan, please review it and approve if applicable by entering `yes` in the shell.

( In order to just review the diff without applying changes, please use: `cdktf diff fortify` ).

### Deploy via terraform cli

From within the terraform directory ( `devops/terraform` ):

- Synthesize the terraform stack using: `cdktf synth`
- Chang the current directory to: `devops/terraform/cdktf.out/stacks/fortify`
- For applying the changes use: `terraform apply`
- Once asked for review of the execution plan, please review it and approve if applicable by entering `yes` in the shell.

( In order to just review the plan without applying changes, please use: `terraform plan` ).
