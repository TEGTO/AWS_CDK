import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export interface LambdaStackProps extends cdk.StackProps {
  functionName: string;
  runtime: lambda.Runtime;
  handler: string;
  code: lambda.Code;
  memorySize?: number;
  timeout?: cdk.Duration;
}

export class LambdaCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const functionName = props.functionName;
    const runtime = props.runtime;
    const handler = props.handler;
    const code = props.code;
    const memorySize = props.memorySize ?? 128;
    const timeout = props.timeout ?? cdk.Duration.seconds(10);

    // Create a DynamoDB table
    const table = new dynamodb.Table(this, 'MyDynamoTable', {
      tableName: 'MyTable',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Lambda function
    const myLambda = new lambda.Function(this, 'MyLambdaFunction', {
      functionName: functionName,
      runtime: runtime,
      handler: handler,
      code: code,
      memorySize: memorySize,
      timeout: timeout
    });

    // Grant Lambda permission to read from the DynamoDB stream
    table.grantStreamRead(myLambda);

    // Add DynamoDB stream as an event source to the Lambda function
    myLambda.addEventSource(new lambdaEventSources.DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.LATEST, // Process only new items
      batchSize: 5, // Process up to 5 records per batch
    }));

    // Output the Lambda function name
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: myLambda.functionName,
    });
  }
}
