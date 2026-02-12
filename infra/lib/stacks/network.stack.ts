import { Stack, StackProps, Tags } from "aws-cdk-lib/core";
import { Peer, Port } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

import { VpcStandard } from "../constructs/network/vpc.standard";
import { SecurityGroupStandard } from "../constructs/network/sg.standard";

import { BASE_TAGS } from "../config/tags";

export class NetworkStack extends Stack {
  public readonly vpc: VpcStandard;
  public readonly httpSg: SecurityGroupStandard;
  public readonly dbSg: SecurityGroupStandard;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new VpcStandard(this, "ECR Cluster VPC", {
      cidr: "10.0.0.0/16",
      logGroupName: "/vpc/VpcFlowLogs",
    });

    this.httpSg = new SecurityGroupStandard(this, "WebServerSg", {
      vpc: this.vpc.vpc,
      securityGroupName: "http-sg",
      description: "Security group for http traffic",
      ingressRules: [
        {
          peer: Peer.anyIpv4(),
          port: Port.tcp(80),
          description: "Allow HTTP from anywhere",
        },
      ],
    });

    this.dbSg = new SecurityGroupStandard(this, "DbSg", {
      vpc: this.vpc.vpc,
      securityGroupName: "db-sg",
      description: "Security group for allowing traffic from private subnets",
      ingressRules: [
        {
          peer: this.httpSg.securityGroup,
          port: Port.tcp(3306),
          description: "Allow backend to access DB",
        },
      ],
    });

    Object.entries(BASE_TAGS).forEach(([key, value]) =>
      Tags.of(this).add(key, value),
    );
  }
}
