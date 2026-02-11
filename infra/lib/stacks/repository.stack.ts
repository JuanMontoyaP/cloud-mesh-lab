import { Stack, StackProps, Tags, CfnOutput } from "aws-cdk-lib/core";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import { BASE_TAGS } from "../config/tags";

import { EcrStandard } from "../constructs/data/ecr.standard";

export class EcrStack extends Stack {
  public readonly ecrUsers: EcrStandard;
  public readonly ecrTasks: EcrStandard;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const ECR_USERS_REPO: string = "users-service";
    this.ecrUsers = new EcrStandard(this, "Users ECR", {
      repoName: ECR_USERS_REPO,
      devTag: "dev-",
      prodTag: "latest",
    });

    this.output_ecr_uri(this.ecrUsers.ecr, ECR_USERS_REPO);

    const ECR_TASKS_REPO: string = "tasks-service";
    this.ecrTasks = new EcrStandard(this, "Tasks ECR", {
      repoName: ECR_TASKS_REPO,
      devTag: "dev-",
      prodTag: "latest",
    });

    this.output_ecr_uri(this.ecrTasks.ecr, ECR_TASKS_REPO);

    Object.entries(BASE_TAGS).forEach(([key, value]) =>
      Tags.of(this).add(key, value),
    );
  }

  private output_ecr_uri(ecr: Repository, ecrName: string) {
    new CfnOutput(this, ecrName, {
      value: ecr.repositoryUri,
      description: `The URI of the ${ecrName} ECR repo`,
    });
  }
}
