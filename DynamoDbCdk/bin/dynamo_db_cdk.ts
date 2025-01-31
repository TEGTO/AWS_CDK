#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { DynamoDbCdkStack } from '../lib/dynamo_db_cdk-stack';

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT_ID!;
const region = process.env.AWS_REGION!;
const tableName = "MyTable";

new DynamoDbCdkStack(app, 'DynamoDbCdkStack', {
  env: {
    account,
    region,
  },
  tableName: tableName,
  globalSecondaryIndexes: [
    {
      indexName: 'Email-Id-Index',
      partitionKey: 'Email',
      partitionKeyType: dynamodb.AttributeType.STRING,
      sortKey: 'Id',
      sortKeyType: dynamodb.AttributeType.STRING,
      projectionType: dynamodb.ProjectionType.ALL,
      readCapacity: 5,
      writeCapacity: 5,
    },
  ],
  localSecondaryIndexes: [
    {
      indexName: 'NameIndex',
      sortKey: 'Name',
      sortKeyType: dynamodb.AttributeType.STRING,
      projectionType: dynamodb.ProjectionType.ALL,
    },
  ]
});

app.synth();