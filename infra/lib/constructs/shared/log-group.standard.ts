import { LogGroup } from "aws-cdk-lib/aws-logs";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { Construct } from "constructs";

export interface LogGroupsStandardProps {
  logGroupName: string;
  retention?: number;
}

export class LogGroupStandard extends Construct {
  public logGroup: LogGroup;

  constructor(scope: Construct, id: string, props: LogGroupsStandardProps) {
    super(scope, id);

    this.createLogGroup(id, props.logGroupName, props.retention);
  }

  private createLogGroup(
    id: string,
    logGroupName: string,
    retention: number = 3,
  ) {
    this.logGroup = new LogGroup(this, id, {
      logGroupName: logGroupName,
      retention: retention,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
