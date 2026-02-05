import { Stack, StackProps, Tags, CfnOutput } from "aws-cdk-lib/core";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import { BASE_TAGS } from "../config/tags";

import { EcrStandard } from "../constructs/data/ecr.standard";

export class EcrStack extends Stack {
  public readonly ecr_users: EcrStandard;
  public readonly ecr_tasks: EcrStandard;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const ECR_USERS_REPO: string = "users-service";
    this.ecr_users = new EcrStandard(this, "Users ECR", {
      repoName: ECR_USERS_REPO,
      devTag: "dev-",
      prodTag: "latest",
    });

    this.output_ecr_uri(this.ecr_users.ecr, ECR_USERS_REPO);

    const ECR_TASKS_REPO: string = "taks-service";
    this.ecr_tasks = new EcrStandard(this, "Tasks ECR", {
      repoName: ECR_TASKS_REPO,
      devTag: "dev-",
      prodTag: "latest",
    });

    this.output_ecr_uri(this.ecr_tasks.ecr, ECR_TASKS_REPO);

    Object.entries(BASE_TAGS).forEach(([key, value]) =>
      Tags.of(this).add(key, value),
    );
  }

  private output_ecr_uri(ecr: Repository, ecr_name: string) {
    new CfnOutput(this, ecr_name, {
      value: ecr.repositoryUri,
      description: `The URI of the ${ecr_name} ECR repo`,
    });
  }
}
