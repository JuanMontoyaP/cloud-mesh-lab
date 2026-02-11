import {
  FargateTaskDefinition,
  ContainerDefinitionOptions,
} from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";

export interface TaskContainers {
  name: string;
  options: ContainerDefinitionOptions;
}

export interface TaskDefStandardProps {
  family: string;
  containers: TaskContainers[];
}

export class TaskDefStandard extends Construct {
  public taskDefinition: FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: TaskDefStandardProps) {
    super(scope, id);

    this.createFargateTaskDef(id, props.family);

    props.containers.forEach((container) => {
      this.addContainer(container.name, container.options);
    });
  }

  private createFargateTaskDef(id: string, family: string) {
    this.taskDefinition = new FargateTaskDefinition(this, id, {
      cpu: 256,
      memoryLimitMiB: 512,
      enableFaultInjection: false,
      family: family,
    });
  }

  private addContainer(id: string, container: ContainerDefinitionOptions) {
    this.taskDefinition.addContainer(id, { ...container });
  }
}
