import {
  ContainerImage,
  LogDrivers,
  Cluster,
  Secret,
} from "aws-cdk-lib/aws-ecs";
import { Stack, StackProps, Duration, Tags } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { DatabaseCluster } from "aws-cdk-lib/aws-rds";
import { SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import * as secretManager from "aws-cdk-lib/aws-secretsmanager";

import { TaskDefStandard } from "../constructs/services/task-definition.standard";
import { ServiceStandard } from "../constructs/services/service.standard";

import { BASE_TAGS } from "../config/tags";

export interface ServiceStackProps extends StackProps {
  cluster: Cluster;
  clusterLogGroup: LogGroup;
  dbCluster: DatabaseCluster;
  usersDbSecret: secretManager.Secret;
  tasksDbSecret: secretManager.Secret;
  usersEcr: Repository;
  tasksEcr: Repository;
  usersSg: SecurityGroup[];
  tasksSg: SecurityGroup[];
}

export class ServicesStack extends Stack {
  public readonly usersTaskDef: TaskDefStandard;
  public readonly tasksTaskDef: TaskDefStandard;
  public readonly usersService: ServiceStandard;
  public readonly taskService: ServiceStandard;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    this.usersTaskDef = new TaskDefStandard(this, "users-task-def", {
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
              logGroup: props.clusterLogGroup,
            }),
            environment: {
              DATABASE_NAME: "users_db",
              DATABASE_READ_HOST: props.dbCluster.clusterReadEndpoint.hostname,
            },
            secrets: {
              DATABASE_HOST: Secret.fromSecretsManager(
                props.dbCluster.secret!,
                "host",
              ),
              DATABASE_PORT: Secret.fromSecretsManager(
                props.dbCluster.secret!,
                "port",
              ),
              DATABASE_USER: Secret.fromSecretsManager(
                props.usersDbSecret,
                "username",
              ),
              DATABASE_PASSWORD: Secret.fromSecretsManager(
                props.usersDbSecret,
                "password",
              ),
            },
          },
        },
      ],
    });

    this.tasksTaskDef = new TaskDefStandard(this, "tasks-task-def", {
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
              logGroup: props.clusterLogGroup,
            }),
            environment: {
              DATABASE_NAME: "tasks_db",
              DATABASE_READ_HOST: props.dbCluster.clusterReadEndpoint.hostname,
            },
            secrets: {
              DATABASE_HOST: Secret.fromSecretsManager(
                props.dbCluster.secret!,
                "host",
              ),
              DATABASE_PORT: Secret.fromSecretsManager(
                props.dbCluster.secret!,
                "port",
              ),
              DATABASE_USER: Secret.fromSecretsManager(
                props.tasksDbSecret,
                "username",
              ),
              DATABASE_PASSWORD: Secret.fromSecretsManager(
                props.tasksDbSecret,
                "password",
              ),
            },
          },
        },
      ],
    });

    this.usersService = new ServiceStandard(this, "users-service", {
      serviceName: "users-mesh",
      cluster: props.cluster,
      taskDefinition: this.usersTaskDef.taskDefinition,
      securityGroups: props.usersSg,
      subnetType: SubnetType.PUBLIC,
      assignPublicIp: true,
      desiredCount: 2,
    });

    this.taskService = new ServiceStandard(this, "tasks-service", {
      serviceName: "tasks-mesh",
      cluster: props.cluster,
      taskDefinition: this.tasksTaskDef.taskDefinition,
      securityGroups: props.tasksSg,
      subnetType: SubnetType.PUBLIC,
      assignPublicIp: true,
      desiredCount: 2,
    });

    Object.entries(BASE_TAGS).forEach(([key, value]) =>
      Tags.of(this).add(key, value),
    );
  }
}
