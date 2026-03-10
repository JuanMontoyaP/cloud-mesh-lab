import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import { AlbStandard } from "../constructs/alb/alb.standard";
import { TargetGroupStandard } from "../constructs/alb/target-group.standard";
import {
  ApplicationListenerRule,
  ListenerAction,
  ListenerCondition,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";

export interface AlbStackProps extends StackProps {
  vpc: Vpc;
  albSg: SecurityGroup;
}

export class AlbStack extends Stack {
  public readonly alb: AlbStandard;
  public readonly usersTg: TargetGroupStandard;
  public readonly tasksTg: TargetGroupStandard;

  constructor(scope: Construct, id: string, props: AlbStackProps) {
    super(scope, id, props);

    this.alb = new AlbStandard(this, "api-alb", {
      loadBalancerName: "api-alb",
      vpc: props.vpc,
      albSg: props.albSg,
    });

    this.usersTg = new TargetGroupStandard(this, "users-tg", {
      targetGroupName: "users-tg",
      vpc: props.vpc,
      healthCheckPath: "/health",
    });

    this.tasksTg = new TargetGroupStandard(this, "tasks-tg", {
      targetGroupName: "tasks-tg",
      vpc: props.vpc,
      healthCheckPath: "/health",
    });

    new ApplicationListenerRule(this, "users-listener-rule", {
      listener: this.alb.alb.listeners[0],
      priority: 1,
      conditions: [ListenerCondition.pathPatterns(["/users/*"])],
      action: ListenerAction.forward([this.usersTg.tg]),
    });

    new ApplicationListenerRule(this, "tasks-listener-rule", {
      listener: this.alb.alb.listeners[0],
      priority: 2,
      conditions: [ListenerCondition.pathPatterns(["/tasks/*"])],
      action: ListenerAction.forward([this.tasksTg.tg]),
    });

    // this.alb.alb.listeners[0].addTargetGroups("users-target-group", {
    //   targetGroups: [this.usersTg.tg],
    // });

    // this.alb.alb.listeners[0].addTargetGroups("tasks-target-group", {
    //   targetGroups: [this.tasksTg.tg],
    // });
  }
}
