#!/opt/homebrew/opt/node/bin/node
import { App } from "aws-cdk-lib/core";
import { EcrStack } from "../lib/stacks/repository.stack";
import { NetworkStack } from "../lib/stacks/network.stack";
import { ClustersStack } from "../lib/stacks/clusters.stack";
import { AuroraStack } from "../lib/stacks/aurora.stack";
import { ServicesStack } from "../lib/stacks/services.stack";
import { stackName } from "../lib/config/naming";
import { MigrationStack } from "../lib/stacks/migration.stack";

const app = new App();

const ecrStack = new EcrStack(app, stackName("cloud-mesh", "dev", "ecr"), {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

const networkStack = new NetworkStack(
  app,
  stackName("cloud-mesh", "dev", "vpc"),
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  },
);

const clusterStack = new ClustersStack(
  app,
  stackName("cloud-mesh", "dev", "ecs"),
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    vpc: networkStack.vpc.vpc,
  },
);

new AuroraStack(app, stackName("cloud-mesh", "dev", "db"), {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  vpc: networkStack.vpc.vpc,
  dbSg: [networkStack.dbSg.securityGroup],
  guiSg: [networkStack.httpSg.securityGroup],
  lambdaSg: [networkStack.lambdaSg.securityGroup],
  cluster: clusterStack.ecsCluster.ecs,
  clusterLogGroup: clusterStack.ecsClusterLogGroup.logGroup,
});

new MigrationStack(app, stackName("cloud-mesh", "dev", "migrations"), {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  clusterLogGroup: clusterStack.ecsClusterLogGroup.logGroup,
});

new ServicesStack(app, stackName("cloud-mesh", "dev", "services"), {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  cluster: clusterStack.ecsCluster.ecs,
  clusterLogGroup: clusterStack.ecsClusterLogGroup.logGroup,
  usersEcr: ecrStack.ecrUsers.ecr,
  usersSg: [networkStack.httpSg.securityGroup],
  tasksEcr: ecrStack.ecrTasks.ecr,
  tasksSg: [networkStack.httpSg.securityGroup],
});
