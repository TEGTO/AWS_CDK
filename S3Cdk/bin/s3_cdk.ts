#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3CdkStack } from '../lib/s3_cdk-stack';

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT_ID!;
const region = process.env.AWS_REGION!;
const bucketName = "my-cdk-s3-bucket-unique-name";

new S3CdkStack(app, 'S3CdkStack', {
  env: {
    account,
    region,
  },
  versioned: true,
  bucketName: bucketName,
  lifecycleRules: [
    {
      id: 'DeleteOldVersions',
      enabled: true,
      noncurrentVersionExpiration: cdk.Duration.days(30), // Delete old versions after 30 days
    },
  ],
});

app.synth();