import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface SecretManagerStackProps extends cdk.StackProps {
  secretName: string;
  generateSecretString?: cdk.aws_secretsmanager.SecretStringGenerator;
  description?: string;
}

export class SecretManagerCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecretManagerStackProps) {
    super(scope, id, props);

    const secretName = props.secretName;
    const generateSecretString = props.generateSecretString;
    const description = props.description;

    // Create a new secret in AWS Secrets Manager
    const mySecret = new secretsmanager.Secret(this, 'MySecret', {
      secretName: secretName,
      generateSecretString: generateSecretString,
      description: description,
    });

    // Output secret name
    new cdk.CfnOutput(this, 'SecretNameOutput', {
      value: mySecret.secretName,
    });
  }
}
