import { Stack, StackProps, Tags, CfnOutput } from "aws-cdk-lib/core";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

import { EcsStandard } from "../constructs/k8s/ecs.standard";

export interface K8sStackProps extends StackProps {
  vpc: Vpc;
}

export class K8sStack extends Stack {
  public readonly ecs_cluster: EcsStandard;

  constructor(scope: Construct, id: string, props: K8sStackProps) {
    super(scope, id, props);

    this.ecs_cluster = new EcsStandard(this, "mesh-cluster", {
      clusterName: "MeshLab",
      vpc: props.vpc,
    });
  }
}
