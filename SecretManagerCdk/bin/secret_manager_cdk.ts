#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SecretManagerCdkStack } from '../lib/secret_manager_cdk-stack';

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT_ID!;
const region = process.env.AWS_REGION!;
const secretName = "Development_Weather.Api_OpenWeatherMapApi__ApiKey";

new SecretManagerCdkStack(app, 'SecretManagerCdkStack', {
  env: {
    account,
    region,
  },
  secretName: secretName,
  generateSecretString: {
    secretStringTemplate: JSON.stringify({
      username: 'admin',
      role: 'admin',
    }),
    generateStringKey: 'password', // Required but ignored
    excludeCharacters: '"@/\\',
  },
});

app.synth();