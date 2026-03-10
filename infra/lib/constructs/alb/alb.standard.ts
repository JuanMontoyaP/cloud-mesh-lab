import {
  ApplicationListenerRule,
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  ListenerAction,
  ListenerCondition,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface AlbStandardProps {
  loadBalancerName: string;
  vpc: Vpc;
  albSg: SecurityGroup;
}

export class AlbStandard extends Construct {
  public alb: ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: AlbStandardProps) {
    super(scope, id);

    this.createAlb(id, props.loadBalancerName, props.vpc, props.albSg);
    this.createDefaultListener();
  }

  private createAlb(
    id: string,
    loadBalancerName: string,
    vpc: Vpc,
    albSg: SecurityGroup,
  ) {
    this.alb = new ApplicationLoadBalancer(this, id, {
      loadBalancerName: loadBalancerName,
      vpc: vpc,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      internetFacing: true,
      securityGroup: albSg,
    });
  }

  private createDefaultListener() {
    this.alb.addListener("default-listener", {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      defaultAction: ListenerAction.fixedResponse(404, {
        contentType: "text/plain",
        messageBody: "Not Found",
      }),
    });
  }

  public addDefaultListenerRule(id: string, tg: ApplicationTargetGroup) {
    new ApplicationListenerRule(this, id, {
      listener: this.alb.listeners[0],
      priority: 2,
      conditions: [ListenerCondition.pathPatterns(["/tasks/*"])],
      action: ListenerAction.forward([tg]),
    });
  }
}
