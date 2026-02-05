export function stackName(app: string, stage: string, stack: string) {
  return `${app}-${stage}-${stack}`;
}

export function resourceName(app: string, stage: string, resource: string) {
  return `${app}-${stage}-${resource}`;
}
