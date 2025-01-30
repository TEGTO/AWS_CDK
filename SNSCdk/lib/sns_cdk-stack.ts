import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface SNSStackProps extends cdk.StackProps {
  topicName: string;
  createDeadLetterQueue?: boolean;
  emailSubscriptions?: string[];
  queueNames?: string[];
  retentionPeriods?: cdk.Duration[];
  visibilityTimeouts?: cdk.Duration[];
  maxReceiveCounts?: number[];
  rawMessageDeliveries?: boolean[];
  filterPolicies?: Record<string, sns.SubscriptionFilter>[];
  bodyFilterPolicies?: Record<string, sns.FilterOrPolicy>[];
}

export class SnsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SNSStackProps) {
    super(scope, id, props);

    const createDeadLetterQueue = props.createDeadLetterQueue ?? false;
    const emailSubscriptions = props.emailSubscriptions ?? [];
    const queueNames = props.queueNames ?? [];

    const topic = new sns.Topic(this, 'MyTopic', {
      topicName: props.topicName,
      displayName: `SNS Topic for ${props.topicName}`,
    });

    for (let index = 0; index < queueNames.length; index++) {
      const retentionPeriod = props.retentionPeriods ? props.retentionPeriods[index] ?? cdk.Duration.days(4) : cdk.Duration.days(4);
      const visibilityTimeout = props.visibilityTimeouts ? props.visibilityTimeouts[index] ?? cdk.Duration.seconds(30) : cdk.Duration.seconds(30);
      const maxReceiveCount = props.maxReceiveCounts ? props.maxReceiveCounts[index] ?? 3 : 3;
      const rawMessageDelivery = props.rawMessageDeliveries ? props.rawMessageDeliveries[index] ?? false : false;
      const filterPolicy = props.filterPolicies ? props.filterPolicies[index] : undefined;
      const bodyFilterPolicies = props.bodyFilterPolicies ? props.bodyFilterPolicies[index] : undefined;

      let dlq: sqs.Queue | undefined = undefined;

      if (createDeadLetterQueue) {
        dlq = new sqs.Queue(this, `DeadLetterQueue${index}`, {
          queueName: `${queueNames[index]}-dlq`,
          retentionPeriod: cdk.Duration.days(14),
        });
      }

      const queue = new sqs.Queue(this, `MyQueue${index}`, {
        queueName: queueNames[index],
        visibilityTimeout: visibilityTimeout,
        retentionPeriod: retentionPeriod,
        deadLetterQueue: dlq
          ? { queue: dlq, maxReceiveCount: maxReceiveCount }
          : undefined,
      });

      topic.addSubscription(new sns_subscriptions.SqsSubscription(queue, {
        rawMessageDelivery: rawMessageDelivery,
        filterPolicyWithMessageBody: bodyFilterPolicies,
        filterPolicy: filterPolicy,
      }));
    }

    emailSubscriptions.forEach(email => {
      topic.addSubscription(new sns_subscriptions.EmailSubscription(email));
    });

    new cdk.CfnOutput(this, 'TopicArn', {
      value: topic.topicArn,
      exportName: `application-integration::${props.topicName}::arn`,
      description: 'ARN of the SNS Topic',
    });
  }
}