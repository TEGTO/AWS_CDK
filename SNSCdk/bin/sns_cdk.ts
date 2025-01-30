#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import { SnsCdkStack } from '../lib/sns_cdk-stack';

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT_ID!;
const region = process.env.AWS_REGION!;
const topicName = "MyTopic";

new SnsCdkStack(app, 'SnsCdkStack', {
  env: {
    account,
    region,
  },
  topicName: topicName,
  createDeadLetterQueue: true,
  queueNames: ["MyQueue1"],
  rawMessageDeliveries: [true],
  filterPolicies: [
    {
      MessageType: sns.SubscriptionFilter.stringFilter({
        allowlist: ['CustomerCreated'],
      }),
      // priority: sns.SubscriptionFilter.numericFilter({
      //   greaterThanOrEqualTo: 5,
      // }),
    },
  ],
  // bodyFilterPolicies: [
  //   {
  //     Email: sns.FilterOrPolicy.filter(
  //       sns.SubscriptionFilter.stringFilter({
  //         allowlist: [
  //           "valid@email.com",
  //         ],
  //       })
  //     ),
  //   },
  // ]
});

app.synth();