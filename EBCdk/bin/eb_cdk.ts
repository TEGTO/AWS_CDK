import * as cdk from 'aws-cdk-lib';
import { EbCdkStack } from '../lib/eb_cdk-stack';

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT_ID!;
const region = process.env.AWS_REGION!;
const appName = process.env.APPNAME!;
const envName = process.env.ENVNAME!;
const publishPath = process.env.PUBLISH_PATH!;

const environmentProperties = [
  {
    optionName: 'ASPNETCORE_ENVIRONMENT',
    value: process.env.ASPNETCORE_ENVIRONMENT!,
  },
  {
    optionName: 'AllowedCORSOrigins',
    value: process.env.AllowedCORSOrigins!,
  },
  {
    optionName: 'UseCORS',
    value: process.env.UseCORS!,
  },
  {
    optionName: 'EFCreateDatabase',
    value: process.env.EFCreateDatabase!,
  },
  {
    optionName: 'ConnectionStrings__Db',
    value: process.env.ConnectionStrings__Db!,
  },
];

// Create the Elastic Beanstalk Stack
new EbCdkStack(app, 'ECatalogProductApiStack', {
  env: {
    account,
    region,
  },
  appName,
  envName,
  path: publishPath,
  environmentProperties,
});

app.synth();
