import { FargateService, Cluster, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface ServiceStandardProps {
  serviceName: string;
  cluster: Cluster;
  taskDefinition: TaskDefinition;
  securityGroups: SecurityGroup[];
  subnetType: SubnetType;
  assignPublicIp?: boolean;
  desiredCount?: number;
}

export class ServiceStandard extends Construct {
  public service: FargateService;

  constructor(scope: Construct, id: string, props: ServiceStandardProps) {
    super(scope, id);

    this.createService(
      id,
      props.serviceName,
      props.cluster,
      props.taskDefinition,
      props.securityGroups,
      props.subnetType,
      props.assignPublicIp,
      props.desiredCount,
    );
  }

  private createService(
    id: string,
    serviceName: string,
    cluster: Cluster,
    taskDefinition: TaskDefinition,
    securityGroups: SecurityGroup[],
    subnetType: SubnetType,
    assignPublicIp?: boolean,
    desiredCount?: number,
  ) {
    this.service = new FargateService(this, id, {
      serviceName: serviceName,
      cluster: cluster,
      taskDefinition: taskDefinition,
      minHealthyPercent: 80,
      securityGroups: securityGroups,
      vpcSubnets: { subnetType: subnetType },
      healthCheckGracePeriod: Duration.minutes(1),
      desiredCount: desiredCount ?? 1,
      assignPublicIp: assignPublicIp ?? false,
    });
  }
}
