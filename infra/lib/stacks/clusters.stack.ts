import { Stack, StackProps, Tags, CfnOutput } from "aws-cdk-lib/core";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

import { EcsStandard } from "../constructs/clusters/ecs.standard";
import { LogGroupStandard } from "../constructs/shared/log-group.standard";

import { BASE_TAGS } from "../config/tags";

export interface ClustersStackProps extends StackProps {
  vpc: Vpc;
}

export class ClustersStack extends Stack {
  public readonly ecsCluster: EcsStandard;
  public readonly ecsClusterLogGroup: LogGroupStandard;

  constructor(scope: Construct, id: string, props: ClustersStackProps) {
    super(scope, id, props);

    this.ecsCluster = new EcsStandard(this, "mesh-cluster", {
      clusterName: "MeshLab",
      vpc: props.vpc,
    });

    this.ecsClusterLogGroup = new LogGroupStandard(this, "users-log-group", {
      logGroupName: "/ecs/MeshLab",
    });

    Object.entries(BASE_TAGS).forEach(([key, value]) =>
      Tags.of(this).add(key, value),
    );
  }
}
