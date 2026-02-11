import { Stack, StackProps } from "aws-cdk-lib";
import { Cluster, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

import { ServiceStandard } from "../constructs/services/service.standard";

export interface ServiceStackProps extends StackProps {
  cluster: Cluster;
  usersTaskDefinition: TaskDefinition;
  usersSg: SecurityGroup[];
  tasksTaskDefinition: TaskDefinition;
  tasksSg: SecurityGroup[];
}

export class ServicesStack extends Stack {
  public readonly usersService: ServiceStandard;
  public readonly taskService: ServiceStandard;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    this.usersService = new ServiceStandard(this, "users-service", {
      serviceName: "users-mesh",
      cluster: props.cluster,
      taskDefinition: props.usersTaskDefinition,
      securityGroups: props.usersSg,
      subnetType: SubnetType.PUBLIC,
      assignPublicIp: true,
      desiredCount: 2,
    });

    this.taskService = new ServiceStandard(this, "tasks-service", {
      serviceName: "tasks-mesh",
      cluster: props.cluster,
      taskDefinition: props.tasksTaskDefinition,
      securityGroups: props.tasksSg,
      subnetType: SubnetType.PUBLIC,
      assignPublicIp: true,
      desiredCount: 2,
    });
  }
}
