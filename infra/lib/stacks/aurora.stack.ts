import {
  Stack,
  StackProps,
  Duration,
  Tags,
  CustomResource,
  CfnOutput,
} from "aws-cdk-lib";
import { Vpc, SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { ContainerImage, Cluster, LogDrivers } from "aws-cdk-lib/aws-ecs";
import { Provider } from "aws-cdk-lib/custom-resources";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

import { MySqlAuroraStandard } from "../constructs/data/aurora.standard";
import { TaskDefStandard } from "../constructs/services/task-definition.standard";
import { CustomResourceStandard } from "../constructs/shared/custom-resource.standard";
import { ServiceStandard } from "../constructs/services/service.standard";
import { SecretsStandard } from "../constructs/shared/secrets.standard";
import { LambdaStandard } from "../constructs/compute/lambda.standard";

import { BASE_TAGS } from "../config/tags";

import * as path from "path";

import { createLambdaPackage } from "../helpers/lambda-code.helper";

export interface AuroraStackProps extends StackProps {
  readonly vpc: Vpc;
  readonly dbSg: SecurityGroup[];
  readonly guiSg: SecurityGroup[];
  readonly lambdaSg: SecurityGroup[];
  readonly cluster: Cluster;
  readonly clusterLogGroup: LogGroup;
}

export class AuroraStack extends Stack {
  public readonly dbCluster: MySqlAuroraStandard;
  private dbGuiDef: TaskDefStandard;
  private initLambda: LambdaStandard;
  private userPwdSecret: SecretsStandard;
  private tasksPwdSecret: SecretsStandard;
  private dbInitResource: CustomResourceStandard;

  constructor(scope: Construct, id: string, props: AuroraStackProps) {
    super(scope, id, props);

    this.dbCluster = new MySqlAuroraStandard(this, "my-sql-aurora", {
      vpc: props.vpc,
      clusterName: "ServiceMeshDB",
      description: "DB for the service Mesh App",
      dbSg: props.dbSg,
    });

    this.dbGuiDef = new TaskDefStandard(this, "php-my-admin-def", {
      family: "php-myadmin",
      containers: [
        {
          name: "myadmin",
          options: {
            image: ContainerImage.fromRegistry("phpmyadmin/phpmyadmin:latest"),
            memoryLimitMiB: 512,
            cpu: 256,
            essential: true,
            portMappings: [{ containerPort: 80 }],
            healthCheck: {
              command: ["CMD-SHELL", "curl -f http://localhost:80/ || exit 1"],
              interval: Duration.seconds(30),
              timeout: Duration.seconds(5),
              retries: 3,
              startPeriod: Duration.seconds(60),
            },
            logging: LogDrivers.awsLogs({
              streamPrefix: "phpMyAdmin",
              logGroup: props.clusterLogGroup,
            }),
            environment: {
              PMA_PORT: "3306",
              PMA_ARBITRARY: "1", // Allow connecting to any server
              MYSQL_ROOT_PASSWORD: "", // Leave empty, user will provide credentials
            },
          },
        },
      ],
    });

    new ServiceStandard(this, "gui-service", {
      serviceName: "phpadmin-mesh",
      cluster: props.cluster,
      taskDefinition: this.dbGuiDef.taskDefinition,
      securityGroups: props.guiSg,
      subnetType: SubnetType.PUBLIC,
      assignPublicIp: true,
    });

    this.userPwdSecret = new SecretsStandard(this, "UsersDbPassword", {
      secretName: "usersDbPassword",
      username: "users_user",
      description: "Password for the users_db database",
    });

    this.tasksPwdSecret = new SecretsStandard(this, "TasksDbPassword", {
      secretName: "tasksDbPassword",
      username: "tasks_user",
      description: "Password for the tasks_db database",
    });

    const lambdaPath = path.join(__dirname, "../../../lambda/db-init");
    const outputPath = path.join(__dirname, "../../../.build/lambda/db-init");
    createLambdaPackage("main.py", lambdaPath, outputPath);

    this.initLambda = new LambdaStandard(this, "db-init-lambda", {
      codePath: outputPath,
      description: "Lambda function to initialize the Aurora MySQL database",
      logGroup: props.clusterLogGroup,
      vpc: props.vpc,
      sg: props.lambdaSg,
    });

    if (this.dbCluster.auroraMySqlCluster.secret) {
      this.dbCluster.auroraMySqlCluster.secret.grantRead(
        this.initLambda.lambdaFunction,
      );
    }
    this.userPwdSecret.secret.grantRead(this.initLambda.lambdaFunction);
    this.tasksPwdSecret.secret.grantRead(this.initLambda.lambdaFunction);

    this.dbInitResource = new CustomResourceStandard(this, "db-init-resource", {
      lambdaFunction: this.initLambda.lambdaFunction,
      customResourceProps: {
        DbSecretArn: this.dbCluster.auroraMySqlCluster.secret!.secretArn,
        UsersPasswordArn: this.userPwdSecret.secret.secretArn,
        TasksPasswordArn: this.tasksPwdSecret.secret.secretArn,
        Version: "1.0.0",
      },
    });

    this.dbInitResource.resource.node.addDependency(this.dbCluster);

    Object.entries(BASE_TAGS).forEach(([key, value]) =>
      Tags.of(this).add(key, value),
    );

    this.outputs();
  }

  private outputs() {
    // Outputs
    new CfnOutput(this, "ClusterEndpoint", {
      value: this.dbCluster.auroraMySqlCluster.clusterEndpoint.hostname,
      description: "Aurora Cluster Writer Endpoint",
      exportName: `${this.stackName}-ClusterEndpoint`,
    });

    new CfnOutput(this, "ClusterReadEndpoint", {
      value: this.dbCluster.auroraMySqlCluster.clusterReadEndpoint.hostname,
      description: "Aurora Cluster Reader Endpoint",
      exportName: `${this.stackName}-ClusterReadEndpoint`,
    });

    new CfnOutput(this, "ClusterPort", {
      value: this.dbCluster.auroraMySqlCluster.clusterEndpoint.port.toString(),
      description: "Aurora Cluster Port",
      exportName: `${this.stackName}-ClusterPort`,
    });

    new CfnOutput(this, "MasterSecretArn", {
      value: this.dbCluster.auroraMySqlCluster.secret?.secretArn || "N/A",
      description: "ARN of Aurora master credentials secret",
      exportName: `${this.stackName}-MasterSecretArn`,
    });

    new CfnOutput(this, "UsersPasswordSecretArn", {
      value: this.userPwdSecret.secret.secretArn,
      description: "ARN of users_user password secret",
      exportName: `${this.stackName}-UsersPasswordSecretArn`,
    });

    new CfnOutput(this, "TasksPasswordSecretArn", {
      value: this.tasksPwdSecret.secret.secretArn,
      description: "ARN of tasks_user password secret",
      exportName: `${this.stackName}-TasksPasswordSecretArn`,
    });
  }
}
