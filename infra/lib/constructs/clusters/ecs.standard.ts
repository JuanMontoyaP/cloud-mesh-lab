import { Cluster, ContainerInsights } from "aws-cdk-lib/aws-ecs";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface EcsStandardProps {
  clusterName: string;
  vpc: IVpc;
}

export class EcsStandard extends Construct {
  public ecs: Cluster;

  constructor(scope: Construct, id: string, props: EcsStandardProps) {
    super(scope, id);

    this.createCluster(id, props.clusterName, props.vpc);
  }

  private createCluster(id: string, clusterName: string, vpc: IVpc) {
    this.ecs = new Cluster(this, id, {
      clusterName: clusterName,
      enableFargateCapacityProviders: true,
      containerInsightsV2: ContainerInsights.ENHANCED,
      vpc: vpc,
    });
  }
}
