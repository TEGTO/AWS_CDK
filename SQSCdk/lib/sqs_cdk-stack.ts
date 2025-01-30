import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface SQSStackProps extends cdk.StackProps {
  queueName: string;
  retentionPeriod: cdk.Duration;
  visibilityTimeout: cdk.Duration;
  createDeadLetterQueue?: boolean;
  maxReceiveCount?: number;
}

export class SqsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SQSStackProps) {
    super(scope, id, props);

    const maxReceiveCount = props.maxReceiveCount ?? 5;
    const createDeadLetterQueue = props.createDeadLetterQueue ?? false;

    let dlq: sqs.Queue | undefined = undefined;

    if (createDeadLetterQueue) {
      dlq = new sqs.Queue(this, 'DeadLetterQueue', {
        queueName: `${props.queueName}-dlq`,
        retentionPeriod: cdk.Duration.days(14),
      });
    }

    const queue = new sqs.Queue(this, 'MyQueue', {
      queueName: props.queueName,
      visibilityTimeout: props.visibilityTimeout,
      retentionPeriod: props.retentionPeriod,
      deadLetterQueue: dlq
        ? { queue: dlq, maxReceiveCount: maxReceiveCount }
        : undefined,
    });

    //these following lines are just to make the output and you can use in another projects
    new cdk.CfnOutput(this, 'QueueUrl', {
      value: queue.queueUrl,
      exportName: `application-integration::${props.queueName}::arn`,
      description: 'URL SQS Queue',
    });
  }
}
