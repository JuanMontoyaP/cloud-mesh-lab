import { Function } from "aws-cdk-lib/aws-lambda";
import { CustomResource } from "aws-cdk-lib/core";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

export interface CustomResourceStandardProps {
  lambdaFunction: Function;
  customResourceProps?: { [key: string]: any };
}

export class CustomResourceStandard extends Construct {
  public provider: Provider;
  public resource: CustomResource;

  constructor(
    scope: Construct,
    id: string,
    props: CustomResourceStandardProps,
  ) {
    super(scope, id);
    this.createProvider(`${id}-provider`, props.lambdaFunction);
    this.createCustomResource(`${id}-resource`, props.customResourceProps);
  }

  private createProvider(id: string, lambdaFunction: Function) {
    this.provider = new Provider(this, id, {
      onEventHandler: lambdaFunction,
    });
  }

  private createCustomResource(
    id: string,
    customResourceProps?: { [key: string]: any },
  ) {
    this.resource = new CustomResource(this, id, {
      serviceToken: this.provider.serviceToken,
      properties: customResourceProps || {},
    });
  }
}
