import {
  Vpc,
  IIpAddresses,
  IpAddresses,
  IpProtocol,
  SubnetType,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface VpcStandardProps {
  cidr: string;
}

export class VpcStandard extends Construct {
  public vpc: Vpc;

  constructor(scope: Construct, id: string, props: VpcStandardProps) {
    super(scope, id);

    this.createVpc(id, IpAddresses.cidr(props.cidr));
  }

  private createVpc(id: string, cidr: IIpAddresses, maxAzs: number = 2) {
    this.vpc = new Vpc(this, id, {
      ipAddresses: cidr,
      maxAzs: maxAzs,
      createInternetGateway: true,
      ipProtocol: IpProtocol.IPV4_ONLY,
      restrictDefaultSecurityGroup: true,
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
      ],
    });
  }
}
