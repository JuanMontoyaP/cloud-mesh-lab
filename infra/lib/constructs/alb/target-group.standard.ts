import {
  TargetType,
  ApplicationTargetGroup,
  TargetGroupIpAddressType,
  ApplicationProtocol,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface TargetGroupStandardProps {
  targetGroupName: string;
  vpc: Vpc;
  healthCheckPath: string;
  port?: number;
}

export class TargetGroupStandard extends Construct {
  public tg: ApplicationTargetGroup;

  constructor(scope: Construct, id: string, props: TargetGroupStandardProps) {
    super(scope, id);

    this.createTargetGroup(
      id,
      props.targetGroupName,
      props.vpc,
      props.healthCheckPath,
      props.port,
    );
  }

  private createTargetGroup(
    id: string,
    targetGroupName: string,
    vpc: Vpc,
    healthCheckPath = "/health",
    port?: number,
  ) {
    this.tg = new ApplicationTargetGroup(this, id, {
      targetGroupName: targetGroupName,
      vpc: vpc,
      ipAddressType: TargetGroupIpAddressType.IPV4,
      port: port ?? 80,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.IP,
      healthCheck: {
        healthyHttpCodes: "200-399",
        path: healthCheckPath,
      },
    });
  }
}
