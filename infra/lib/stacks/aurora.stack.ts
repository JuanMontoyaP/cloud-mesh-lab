import { Stack, StackProps, Duration, Tags } from "aws-cdk-lib";
import { Vpc, SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { ContainerImage, Cluster, LogDrivers } from "aws-cdk-lib/aws-ecs";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

import { MySqlAuroraStandard } from "../constructs/data/aurora.standard";
import { TaskDefStandard } from "../constructs/services/task-definition.standard";
import { ServiceStandard } from "../constructs/services/service.standard";

import { BASE_TAGS } from "../config/tags";

export interface AuroraStackProps extends StackProps {
  vpc: Vpc;
  dbSg: SecurityGroup[];
  guiSg: SecurityGroup[];
  cluster: Cluster;
  clusterLogGroup: LogGroup;
}

export class AuroraStack extends Stack {
  public readonly dbCluster: MySqlAuroraStandard;
  private dbGuiDef: TaskDefStandard;

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

    Object.entries(BASE_TAGS).forEach(([key, value]) =>
      Tags.of(this).add(key, value),
    );
  }
}
