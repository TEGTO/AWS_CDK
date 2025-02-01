#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LambdaCdkStack } from '../lib/lambda_cdk-stack';

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT_ID!;
const region = process.env.AWS_REGION!;
const functionName = "MyFunction";
const runtime = lambda.Runtime.DOTNET_8;
const handler = "MyFunction::MyFunction.Function::FunctionHandler";
const code = lambda.Code.fromAsset('src/MyFunction/bin/Release/netcoreapp3.1/publish');

new LambdaCdkStack(app, 'S3CdkStack', {
  env: {
    account,
    region,
  },
  functionName: functionName,
  runtime: runtime,
  handler: handler,
  code: code,
});

app.synth();