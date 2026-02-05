#!/opt/homebrew/opt/node/bin/node
import * as cdk from "aws-cdk-lib/core";
import { EcrStack } from "../lib/stacks/repository.stack";
import { stackName } from "../lib/config/naming";

const app = new cdk.App();

new EcrStack(app, stackName("cloud-mesh", "dev", "ecr"), {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
