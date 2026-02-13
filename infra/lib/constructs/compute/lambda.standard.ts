import { LogGroup } from "aws-cdk-lib/aws-logs";
import { SubnetType, IVpc, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface LambdaStandardProps {
  codePath: string;
  description: string;
  logGroup: LogGroup;
  handler?: string;
  runtime?: Runtime;
  vpc?: IVpc;
  sg?: SecurityGroup[];
}

export class LambdaStandard extends Construct {
  public lambdaFunction: Function;

  constructor(scope: Construct, id: string, props: LambdaStandardProps) {
    super(scope, id);
    this.createLambdaFunction(
      id,
      props.codePath,
      props.description,
      props.logGroup,
      props.runtime,
      props.handler,
      props.vpc,
      props.sg,
    );
  }

  private createLambdaFunction(
    id: string,
    codePath: string,
    description: string,
    logGroup: LogGroup,
    runtime?: Runtime,
    handler?: string,
    vpc?: IVpc,
    sg?: SecurityGroup[],
  ) {
    this.lambdaFunction = new Function(this, id, {
      runtime: runtime ?? Runtime.PYTHON_3_14,
      handler: handler ?? "main.handler",
      code: Code.fromAsset(codePath),
      timeout: Duration.minutes(5),
      memorySize: 256,
      vpc: vpc ?? undefined,
      vpcSubnets: vpc
        ? { subnetType: SubnetType.PRIVATE_WITH_EGRESS }
        : undefined,
      description: description,
      logGroup: logGroup,
      securityGroups: sg ?? undefined,
    });
  }
}
