import { Stack, StackProps, Tags, CfnOutput, Duration } from "aws-cdk-lib/core";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { ContainerImage, LogDrivers } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";

import { EcsStandard } from "../constructs/clusters/ecs.standard";
import { TaskDefStandard } from "../constructs/services/task-definition.standard";
import { LogGroupStandard } from "../constructs/shared/log-group.standard";

import { BASE_TAGS } from "../config/tags";

export interface ClustersStackProps extends StackProps {
  vpc: Vpc;
  usersEcr: Repository;
  tasksEcr: Repository;
}

export class ClustersStack extends Stack {
  public readonly ecsCluster: EcsStandard;
  public readonly usersTaskDef: TaskDefStandard;
  public readonly tasksTaskDef: TaskDefStandard;
  private readonly ecsClusterLogGroup: LogGroupStandard;

  constructor(scope: Construct, id: string, props: ClustersStackProps) {
    super(scope, id, props);

    this.ecsCluster = new EcsStandard(this, "mesh-cluster", {
      clusterName: "MeshLab",
      vpc: props.vpc,
    });

    this.ecsClusterLogGroup = new LogGroupStandard(this, "users-log-group", {
      logGroupName: "/ecs/MeshLab",
    });

    this.usersTaskDef = new TaskDefStandard(this, "users-service", {
      family: "users-mesh",
      containers: [
        {
          name: "users",
          options: {
            image: ContainerImage.fromEcrRepository(props.usersEcr, "latest"),
            memoryLimitMiB: 512,
            cpu: 256,
            essential: true,
            portMappings: [{ containerPort: 80 }],
            healthCheck: {
              command: [
                "CMD-SHELL",
                "wget --no-verbose --tries=1 --spider http://localhost:80/health/ || exit 1",
              ],
              interval: Duration.seconds(30),
              timeout: Duration.seconds(5),
              retries: 3,
              startPeriod: Duration.seconds(60),
            },
            logging: LogDrivers.awsLogs({
              streamPrefix: "usersServiceMesh",
              logGroup: this.ecsClusterLogGroup.logGroup,
            }),
            environment: {
              PORT: "8000",
            },
          },
        },
      ],
    });

    this.tasksTaskDef = new TaskDefStandard(this, "tasks-service", {
      family: "tasks-mesh",
      containers: [
        {
          name: "tasks",
          options: {
            image: ContainerImage.fromEcrRepository(props.tasksEcr, "latest"),
            memoryLimitMiB: 512,
            cpu: 256,
            essential: true,
            portMappings: [{ containerPort: 80 }],
            healthCheck: {
              command: [
                "CMD-SHELL",
                "wget --no-verbose --tries=1 --spider http://localhost:80/health/ || exit 1",
              ],
              interval: Duration.seconds(30),
              timeout: Duration.seconds(5),
              retries: 3,
              startPeriod: Duration.seconds(60),
            },
            logging: LogDrivers.awsLogs({
              streamPrefix: "tasksServiceMesh",
              logGroup: this.ecsClusterLogGroup.logGroup,
            }),
            environment: {
              PORT: "8000",
            },
          },
        },
      ],
    });

    Object.entries(BASE_TAGS).forEach(([key, value]) =>
      Tags.of(this).add(key, value),
    );
  }
}
