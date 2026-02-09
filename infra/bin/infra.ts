#!/opt/homebrew/opt/node/bin/node
import { App } from "aws-cdk-lib/core";
import { EcrStack } from "../lib/stacks/repository.stack";
import { NetworkStack } from "../lib/stacks/network.stack";
import { stackName } from "../lib/config/naming";

const app = new App();

new EcrStack(app, stackName("cloud-mesh", "dev", "ecr"), {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new NetworkStack(app, stackName("cloud-mesh", "dev", "vpc"), {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
