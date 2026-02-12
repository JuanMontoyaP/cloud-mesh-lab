import {
  Vpc,
  IIpAddresses,
  IpAddresses,
  IpProtocol,
  SubnetType,
  FlowLogDestination,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

import { LogGroupStandard } from "../shared/log-group.standard";

export interface VpcStandardProps {
  cidr: string;
  maxAzs?: number;
  logGroupName: string;
  retention?: number;
}

export class VpcStandard extends Construct {
  public vpc: Vpc;
  private vpcLogGroup: LogGroupStandard;

  constructor(scope: Construct, id: string, props: VpcStandardProps) {
    super(scope, id);

    this.createVpc(id, IpAddresses.cidr(props.cidr), props.maxAzs);

    this.vpcLogGroup = new LogGroupStandard(this, "FlowLogs", {
      logGroupName: props.logGroupName,
      retention: props.retention,
    });

    this.vpc.addFlowLog("FlowLogs", {
      destination: FlowLogDestination.toCloudWatchLogs(
        this.vpcLogGroup.logGroup,
      ),
    });
  }

  private createVpc(id: string, cidr: IIpAddresses, maxAzs: number = 2) {
    this.vpc = new Vpc(this, id, {
      ipAddresses: cidr,
      maxAzs: maxAzs,
      createInternetGateway: true,
      ipProtocol: IpProtocol.IPV4_ONLY,
      restrictDefaultSecurityGroup: true,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "PublicSubnet",
          subnetType: SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
        {
          cidrMask: 24,
          name: "PrivateSubnet",
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: "IsolatedSubnet",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
  }
}
