import { SecretValue, Stack, StackProps } from "aws-cdk-lib";
import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { BuildConfig } from "../bin/cdk";
import { GitHubTrigger } from "aws-cdk-lib/aws-codepipeline-actions";
import { HelloAppStack } from "./hello-app-stack";
import { HelloAppDeployStage } from "./hello-app-deploy-stage";

export class DeployPipeline extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    config: BuildConfig
  ) {
    super(scope, id, props);
    if (!process.env["GITHUB_TOKEN"]) {
      throw new Error(`"GITHUB_TOKEN env is missing"`);
    }
    const pipeline = new CodePipeline(
      this,
      `app-pipeline-${config.Enviroment}`,
      {
        synth: new CodeBuildStep(`Sync-${config.Enviroment}`, {
          input: CodePipelineSource.gitHub(
            `humayunj/generic-cdk-app`,
            `preview`,
            {
              authentication: SecretValue.unsafePlainText(
                process.env["GITHUB_TOKEN"]
              ),
              trigger: GitHubTrigger.WEBHOOK,
            }
          ),
          installCommands: ["npm install -g aws-cdk"],
          commands: ["npm ci", "npm run build", "npx cdk synth"],
        }),
      }
    );
    pipeline.addStage(
      new HelloAppDeployStage(
        this,
        `hello-app-stage-${config.Enviroment}`,
        props,
        config
      )
    );
  }
}
