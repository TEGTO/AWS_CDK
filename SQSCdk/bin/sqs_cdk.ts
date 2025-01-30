#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SqsCdkStack } from '../lib/sqs_cdk-stack';

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT_ID!;
const region = process.env.AWS_REGION!;
const queueName = "MyQueue";
const retentionPeriod = cdk.Duration.days(4);
const visibilityTimeout = cdk.Duration.seconds(30);

new SqsCdkStack(app, 'SqsCdkStack', {
  env: {
    account,
    region,
  },
  queueName: queueName,
  retentionPeriod: retentionPeriod,
  visibilityTimeout: visibilityTimeout,
  createDeadLetterQueue: true,
  maxReceiveCount: 5,
});

app.synth();