import { Stack, StackProps, Tags } from "aws-cdk-lib/core";
import { Construct } from "constructs";

import { BASE_TAGS } from "../config/tags";
import { VpcStandard } from "../constructs/network/vpc.standard";

export class NetworkStack extends Stack {
  public readonly vpc: VpcStandard;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new VpcStandard(this, "ECR Cluster VPC", {
      cidr: "10.0.0.0/16",
    });

    Object.entries(BASE_TAGS).forEach(([key, value]) =>
      Tags.of(this).add(key, value),
    );
  }
}
