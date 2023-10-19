#!/usr/bin/env node
import "dotenv/config";

import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { HelloAppStack } from "../lib/hello-app-stack";
import { DeployPipeline } from "../lib/deploy-pipeline";

export interface BuildConfig {
  Enviroment: string;
}

if (!process.env["env"]) {
  throw new Error("No `env` specified.");
}

const buildConfig: BuildConfig = {
  Enviroment: process.env["env"],
};

const app = new cdk.App();
new DeployPipeline(
  app,
  `HelloAppPipelineStack-${buildConfig.Enviroment}`,
  {
    /* If you don't specify 'env', this stack will be environment-agnostic.
     * Account/Region-dependent features and context lookups will not work,
     * but a single synthesized template can be deployed anywhere. */
    /* Uncomment the next line to specialize this stack for the AWS Account
     * and Region that are implied by the current CLI configuration. */
    // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    /* Uncomment the next line if you know exactly what Account and Region you
     * want to deploy the stack to. */
    // env: { account: '123456789012', region: 'us-east-1' },
    /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  },
  buildConfig
);
