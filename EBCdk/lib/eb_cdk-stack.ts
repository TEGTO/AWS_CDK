import * as cdk from 'aws-cdk-lib';
import { CfnApplication, CfnApplicationVersion, CfnEnvironment } from 'aws-cdk-lib/aws-elasticbeanstalk';
import { CfnInstanceProfile, ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';

export interface EbCdkStackProps extends cdk.StackProps {
  minSize?: string;
  maxSize?: string;
  instanceTypes?: string;
  solutionStackName?: string;
  appName: string;
  envName: string;
  path: string;
  environmentProperties?: { optionName: string; value: string }[];
}

export class EbCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EbCdkStackProps) {
    super(scope, id, props);

    // Default property values
    const minSize = props.minSize ?? '1';
    const maxSize = props.maxSize ?? '1';
    const instanceTypes = props.instanceTypes ?? 't2.micro';
    const solutionStackName = props.solutionStackName ?? '64bit Amazon Linux 2023 v3.2.2 running .NET 8';

    // Create an S3 asset from the source directory
    const webAppZipArchive = new Asset(this, 'WebAppZip', {
      path: props.path,
    });

    // Create an Elastic Beanstalk application
    const app = new CfnApplication(this, 'Application', {
      applicationName: props.appName,
    });

    // Create an application version linked to the S3 asset
    const appVersionProps = new CfnApplicationVersion(this, 'AppVersion', {
      applicationName: props.appName,
      sourceBundle: {
        s3Bucket: webAppZipArchive.s3BucketName,
        s3Key: webAppZipArchive.s3ObjectKey,
      },
    });

    // Ensure the application exists before the application version is created
    appVersionProps.addDependency(app);

    // Create an IAM role for Elastic Beanstalk instances
    const myRole = new Role(this, `${props.appName}-aws-elasticbeanstalk-ec2-role`, {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
    });

    myRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier'));

    // Create an instance profile for the Elastic Beanstalk environment
    const myProfileName = `${props.appName}-InstanceProfile`;
    const instanceProfile = new CfnInstanceProfile(this, myProfileName, {
      instanceProfileName: myProfileName,
      roles: [myRole.roleName],
    });

    // Configure Elastic Beanstalk environment options
    const optionSettingProperties: CfnEnvironment.OptionSettingProperty[] = [
      {
        namespace: 'aws:autoscaling:launchconfiguration',
        optionName: 'IamInstanceProfile',
        value: myProfileName,
      },
      {
        namespace: 'aws:autoscaling:asg',
        optionName: 'MinSize',
        value: minSize,
      },
      {
        namespace: 'aws:autoscaling:asg',
        optionName: 'MaxSize',
        value: maxSize,
      },
      {
        namespace: 'aws:ec2:instances',
        optionName: 'InstanceTypes',
        value: instanceTypes,
      },
    ];

    // Add custom environment properties
    if (props.environmentProperties) {
      props.environmentProperties.forEach((envProp) => {
        optionSettingProperties.push({
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: envProp.optionName,
          value: envProp.value,
        });
      });
    }

    // Create an Elastic Beanstalk environment
    new CfnEnvironment(this, 'Environment', {
      environmentName: props.envName,
      applicationName: app.applicationName!,
      solutionStackName: solutionStackName,
      optionSettings: optionSettingProperties,
      versionLabel: appVersionProps.ref,
    });
  }
}
