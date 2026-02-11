import { SecurityGroup, IVpc, IPeer, Port } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface IngressRule {
  peer: IPeer;
  port: Port;
  description: string;
}

export interface SecurityGroupStandardProps {
  vpc: IVpc;
  securityGroupName: string;
  description: string;
  allowAllOutbound?: boolean;
  ingressRules?: IngressRule[];
}

export class SecurityGroupStandard extends Construct {
  public securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupStandardProps) {
    super(scope, id);

    this.creteSecurityGroup(
      "SecurityGroup",
      props.vpc,
      props.securityGroupName,
      props.description,
      props.allowAllOutbound,
    );

    if (props.ingressRules) {
      props.ingressRules.forEach((rule, _) => {
        this.securityGroup.addIngressRule(
          rule.peer,
          rule.port,
          rule.description,
        );
      });
    }
  }

  private creteSecurityGroup(
    id: string,
    vpc: IVpc,
    securityGroupName: string,
    description: string,
    allowAllOutbound?: boolean,
  ) {
    this.securityGroup = new SecurityGroup(this, id, {
      vpc: vpc,
      securityGroupName: securityGroupName,
      description: description,
      allowAllOutbound: allowAllOutbound ?? true,
    });
  }
}
