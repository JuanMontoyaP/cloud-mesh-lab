import {
  SubnetGroup,
  ClusterInstance,
  DatabaseCluster,
  DatabaseClusterEngine,
  AuroraMysqlEngineVersion,
} from "aws-cdk-lib/aws-rds";
import {
  Vpc,
  SubnetType,
  ISecurityGroup,
  InstanceType,
  InstanceClass,
  InstanceSize,
} from "aws-cdk-lib/aws-ec2";
import { RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface MySqlAuroraStandardProps {
  vpc: Vpc;
  clusterName: string;
  description: string;
  dbSg: ISecurityGroup[];
}

export class MySqlAuroraStandard extends Construct {
  public auroraMySqlCluster: DatabaseCluster;
  private dbSubnetGroup: SubnetGroup;

  constructor(scope: Construct, id: string, props: MySqlAuroraStandardProps) {
    super(scope, id);

    this.createDbSubnetGroup(
      `${id}-subnet-group`,
      props.vpc,
      props.clusterName,
      props.description,
    );

    this.createDbCluster(id, props.clusterName, props.dbSg, props.vpc);
  }

  private createDbSubnetGroup(
    id: string,
    vpc: Vpc,
    subnetGroupName: string,
    description: string,
  ) {
    this.dbSubnetGroup = new SubnetGroup(this, id, {
      vpc: vpc,
      description: description,
      removalPolicy: RemovalPolicy.DESTROY,
      subnetGroupName: subnetGroupName,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
    });
  }

  private createDbCluster(
    id: string,
    clusterIdentifier: string,
    dbSg: ISecurityGroup[],
    vpc: Vpc,
  ) {
    this.auroraMySqlCluster = new DatabaseCluster(this, id, {
      engine: DatabaseClusterEngine.auroraMysql({
        version: AuroraMysqlEngineVersion.VER_3_11_1,
      }),
      clusterIdentifier: clusterIdentifier,
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
      securityGroups: dbSg,
      subnetGroup: this.dbSubnetGroup,
      vpc: vpc,
      writer: ClusterInstance.provisioned("writer", {
        instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM),
      }),
      readers: [ClusterInstance.provisioned("reader")],
    });
  }
}
