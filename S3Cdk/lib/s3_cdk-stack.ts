import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface S3StackProps extends cdk.StackProps {
  bucketName: string;
  versioned?: boolean;
  encryption?: s3.BucketEncryption;
  blockPublicAccess?: s3.BlockPublicAccess;
  removalPolicy?: cdk.RemovalPolicy;
  lifecycleRules?: cdk.aws_s3.LifecycleRule[];
}

export class S3CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    const bucketName = props.bucketName;
    const versioned = props.versioned ?? false;
    const encryption = props.encryption ?? s3.BucketEncryption.S3_MANAGED;
    const blockPublicAccess = props.blockPublicAccess ?? s3.BlockPublicAccess.BLOCK_ALL;
    const removalPolicy = props.removalPolicy ?? cdk.RemovalPolicy.RETAIN;
    const lifecycleRules = props.lifecycleRules ?? [];

    // Create S3 Bucket
    const myBucket = new s3.Bucket(this, 'MyS3Bucket', {
      bucketName: bucketName,
      versioned: versioned,
      encryption: encryption,
      blockPublicAccess: blockPublicAccess,
      removalPolicy: removalPolicy,
      lifecycleRules: lifecycleRules
    });

    // Output bucket name
    new cdk.CfnOutput(this, 'BucketNameOutput', {
      value: myBucket.bucketName,
    });
  }
}
