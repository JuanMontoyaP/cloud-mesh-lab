import { Stack, StackProps, Tags, CfnOutput } from "aws-cdk-lib/core";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

import { EcsStandard } from "../constructs/clusters/ecs.standard";

export interface ClustersStackProps extends StackProps {
  vpc: Vpc;
}

export class ClustersStack extends Stack {
  public readonly ecs_cluster: EcsStandard;

  constructor(scope: Construct, id: string, props: ClustersStackProps) {
    super(scope, id, props);

    this.ecs_cluster = new EcsStandard(this, "mesh-cluster", {
      clusterName: "MeshLab",
      vpc: props.vpc,
    });
  }
}
