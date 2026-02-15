import { Stack, StackProps } from "aws-cdk-lib";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { DatabaseCluster } from "aws-cdk-lib/aws-rds";
import { ContainerImage, LogDrivers, Secret } from "aws-cdk-lib/aws-ecs";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { Construct } from "constructs/lib/construct";
import * as secretManager from "aws-cdk-lib/aws-secretsmanager";

import { TaskDefStandard } from "../constructs/services/task-definition.standard";

import * as path from "path";

export interface MigrationStackProps extends StackProps {
  dbCluster: DatabaseCluster;
  usersDbSecret: secretManager.Secret;
  tasksDbSecret: secretManager.Secret;
  clusterLogGroup: LogGroup;
}

export class MigrationStack extends Stack {
  private taskMigrationDef: TaskDefStandard;
  private usersMigrationDef: TaskDefStandard;

  constructor(scope: Construct, id: string, props: MigrationStackProps) {
    super(scope, id, props);

    const taskDockerFilePath = path.join(
      __dirname,
      "../../../app/tasks/Dockerfile.migrations",
    );

    this.taskMigrationDef = new TaskDefStandard(this, "migration-task-def", {
      family: "task-migration-mesh",
      containers: [
        {
          name: "tasksMigration",
          options: {
            image: ContainerImage.fromAsset(path.dirname(taskDockerFilePath), {
              file: path.basename(taskDockerFilePath),
              platform: Platform.LINUX_AMD64,
            }),
            memoryLimitMiB: 512,
            cpu: 256,
            essential: true,
            logging: LogDrivers.awsLogs({
              streamPrefix: "tasksMigrationMesh",
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

    const usersDockerFilePath = path.join(
      __dirname,
      "../../../app/users/Dockerfile.migrations",
    );

    this.usersMigrationDef = new TaskDefStandard(this, "migration-users-def", {
      family: "users-migration-mesh",
      containers: [
        {
          name: "usersMigration",
          options: {
            image: ContainerImage.fromAsset(path.dirname(usersDockerFilePath), {
              file: path.basename(usersDockerFilePath),
              platform: Platform.LINUX_AMD64,
            }),
            memoryLimitMiB: 512,
            cpu: 256,
            essential: true,
            logging: LogDrivers.awsLogs({
              streamPrefix: "usersMigrationMesh",
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
  }
}
