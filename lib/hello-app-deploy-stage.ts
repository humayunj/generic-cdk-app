import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { BuildConfig } from "../bin/cdk";
import { HelloAppStack } from "./hello-app-stack";

export class HelloAppDeployStage extends Stage {
  constructor(
    scope: Construct,
    id: string,
    props: StageProps,
    config: BuildConfig
  ) {
    super(scope, id, props);
    new HelloAppStack(
      this,
      `HelloAppStack-${config.Enviroment}`,
      props,
      config
    );
  }
}
