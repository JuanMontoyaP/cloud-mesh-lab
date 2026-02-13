import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { Construct } from "constructs";

export interface SecretsStandardProps {
  secretName: string;
  username: string;
  description: string;
}

export class SecretsStandard extends Construct {
  public secret: Secret;

  constructor(scope: Construct, id: string, props: SecretsStandardProps) {
    super(scope, id);

    this.secret = new Secret(this, id, {
      secretName: props.secretName,
      description: props.description,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: props.username }),
        generateStringKey: "password",
        excludePunctuation: true,
        passwordLength: 32,
        excludeCharacters: "\"@/\\'`",
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
