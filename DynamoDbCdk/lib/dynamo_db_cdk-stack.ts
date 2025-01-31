import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DynamoDbStackProps extends cdk.StackProps {
  tableName: string;
  partitionKey?: string;
  partitionKeyType?: dynamodb.AttributeType;
  billingMode?: dynamodb.BillingMode;
  sortKey?: string;
  sortKeyType?: dynamodb.AttributeType;
  readCapacity?: number;
  writeCapacity?: number;
  removalPolicy?: cdk.RemovalPolicy;
  pointInTimeRecovery?: boolean;
  tableClass?: dynamodb.TableClass;
  globalSecondaryIndexes?: {
    indexName: string;
    partitionKey: string;
    partitionKeyType: dynamodb.AttributeType;
    sortKey?: string;
    sortKeyType?: dynamodb.AttributeType;
    projectionType?: dynamodb.ProjectionType;
    readCapacity?: number;
    writeCapacity?: number;
  }[];
  localSecondaryIndexes?: {
    indexName: string;
    sortKey: string;
    sortKeyType: dynamodb.AttributeType;
    projectionType?: dynamodb.ProjectionType;
  }[];
}

export class DynamoDbCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DynamoDbStackProps) {
    super(scope, id, props);

    const partitionKey = props.partitionKey ?? 'pk';
    const partitionKeyType = props.partitionKeyType ?? dynamodb.AttributeType.STRING;
    const billingMode = props.billingMode ?? dynamodb.BillingMode.PAY_PER_REQUEST;
    const sortKey = props.sortKey ?? 'sk';
    const sortKeyType = props.sortKeyType ?? dynamodb.AttributeType.STRING;
    const removalPolicy = props.removalPolicy ?? cdk.RemovalPolicy.DESTROY;
    const pointInTimeRecovery = props.pointInTimeRecovery ?? true;
    const tableClass = props.tableClass ?? dynamodb.TableClass.STANDARD;

    const table = new dynamodb.Table(this, 'Table', {
      tableName: props.tableName,
      partitionKey: { name: partitionKey, type: partitionKeyType },
      sortKey: { name: sortKey, type: sortKeyType },
      billingMode: billingMode,
      readCapacity: props.readCapacity,
      writeCapacity: props.writeCapacity,
      removalPolicy: removalPolicy,
      pointInTimeRecovery: pointInTimeRecovery,
      tableClass: tableClass,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add Global Secondary Indexes (GSIs)
    props.globalSecondaryIndexes?.forEach(gsi => {
      table.addGlobalSecondaryIndex({
        indexName: gsi.indexName,
        partitionKey: { name: gsi.partitionKey, type: gsi.partitionKeyType },
        sortKey: gsi.sortKey ? { name: gsi.sortKey, type: gsi.sortKeyType! } : undefined,
        projectionType: gsi.projectionType ?? dynamodb.ProjectionType.ALL,
        readCapacity: billingMode !== dynamodb.BillingMode.PAY_PER_REQUEST ? gsi.readCapacity : undefined,
        writeCapacity: billingMode !== dynamodb.BillingMode.PAY_PER_REQUEST ? gsi.writeCapacity : undefined,
      });
    });

    // Add Local Secondary Indexes (LSIs) (Requires SortKey in Main Table)
    props.localSecondaryIndexes?.forEach(lsi => {
      table.addLocalSecondaryIndex({
        indexName: lsi.indexName,
        sortKey: { name: lsi.sortKey, type: lsi.sortKeyType },
        projectionType: lsi.projectionType ?? dynamodb.ProjectionType.ALL,
      });
    });

    if (billingMode !== dynamodb.BillingMode.PAY_PER_REQUEST) {
      const readScaling = table.autoScaleReadCapacity({ minCapacity: 1, maxCapacity: 100 });

      // Utilization based scaling
      readScaling.scaleOnUtilization({ targetUtilizationPercent: 70, });

      // // Time based scaling
      // readScaling.scaleOnSchedule('ScaleUpAtsix', {
      //   schedule: appscaling.Schedule.cron({ hour: '6', minute: '0' }),
      //   minCapacity: 75,
      // });
    }

    // const globalTable = new dynamodb.Table(this, 'Table', {
    //   partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
    //   replicationRegions: ['eu-central-1', 'us-east-2', 'us-west-1'],
    //   billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    //   replicationTimeout: Duration.hours(3),
    // });
  }
}