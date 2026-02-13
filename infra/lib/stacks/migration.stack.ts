import { Stack, StackProps } from "aws-cdk-lib";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { ContainerImage, LogDrivers, Cluster } from "aws-cdk-lib/aws-ecs";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { Construct } from "constructs/lib/construct";

import { TaskDefStandard } from "../constructs/services/task-definition.standard";

import * as path from "path";

export interface MigrationStackProps extends StackProps {
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
              DATABASE_URL:
                "mysql+asyncmy://tasks_user:jP0MFJzaNUdXNnDnU1rCCQnFdhAUpYFr@servicemeshdb.cluster-cx0gc0oour0m.us-east-1.rds.amazonaws.com:3306/tasks_db",
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
              DATABASE_URL:
                "mysql+asyncmy://users_user:u76ywnGPQ5xJWKn0ELMa8E0lXfcZwVhR@servicemeshdb.cluster-cx0gc0oour0m.us-east-1.rds.amazonaws.com:3306/users_db",
            },
          },
        },
      ],
    });
  }
}
