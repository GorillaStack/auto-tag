# Auto Tag

[![Build Status](https://travis-ci.org/GorillaStack/auto-tag.svg?branch=master)](https://travis-ci.org/GorillaStack/auto-tag)

This is an open-source tagging solution for AWS. Deploy AutoTag to Lambda using CloudTrail consumed through CloudWatch Events and have each of your resources tagged with the ARN of who created it. Optionally, resources can be tagged with when it was created and which AWS service invoked the request if one is provided.  It was written by [GorillaStack](http://www.gorillastack.com/).

[Read a blog post about the project](http://blog.gorillastack.com/gorillastack-presents-auto-tag).


## About

Automatically tagging resources can greatly improve the ease of cost allocation and governance.

CloudWatch events delivers a near real-time stream of CloudTrail events as soon as a supported resource type is created. CloudWatch event rules triggers our AutoTag code to tag the resource. In this configuration the Lambda function is executed once each time it is triggered by the CloudWatch Event Rule (one event at a time). The CloudWatch Event Rule includes a pattern filter so it is only triggered by the supported events, meaning fewer Lambda invocations and lower operational costs.

## Installation

The friendly team at GorillaStack maintain hosted versions of the CloudFormation templates and Lambda code zip files, so deployment should be pretty straightforward.

### Deploy through the AWS CLI

### Deploy through the AWS Console

__CloudFormation Main Stack__

Deploy this stack first in a single "master" region. This stack is responsible for consuming events from all accounts, in all regions.

1. In the git files on your local machine change directory to `cloud_formation/event_multi_region_template`
1. The next step requires a install of ruby and ruby's bundler
1. Run `bundle install` to install the ruby dependencies to build the template
1. Running the ruby template builder helps to build a Lambda::InvokePermission for each region (SDK version dependent) `./autotag_event_main-template.rb expand > autotag_event_main-template.json`

1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the CloudFormation drop-down button and select "Stack"
1. Click the blue "Create Stack" button
1. Select "Amazon S3 URL" and enter `https://gorillastack-autotag-releases.s3-ap-southeast-2.amazonaws.com/templates/autotag_event_main-template.json`
1. Name the stack "AutoTag" - this cannot be changed
1. In the parameter section:
* CodeS3Bucket: The name of the code bucket in S3 (i.e. `gorillastack-autotag-releases-${region-name}`)
* CodeS3Path: This is the version of AutoTag that you wish to deploy. The default value `autotag-0.5.0.zip` is the latest version
* AutoTagDebugLogging: Enable/Disable Debug Logging for the Lambda Function for **all** processed CloudTrail events
* AutoTagDebugLoggingOnFailure: Enable/Disable Debug Logging when the Lambda Function has a failure
* AutoTagTagsCreateTime: Enable/Disable the "CreateTime" tagging for all resources
* AutoTagTagsInvokedBy: Enable/Disable the "InvokedBy" tagging for all resources (when it is provided)
  
  
__CloudFormation Collector StackSet__

After the main stack status is CREATE_COMPLETE deploy the collector stack to each region where AWS resources should be tagged. This stack deploys the CloudWatch Event Rule and the SNS Topic.

1. Read about the [CloudFormation StackSet Concepts](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-concepts.html)
1. Follow the instructions in the [CloudFormation StackSet Prerequisites](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-prereqs.html) Using the two templates AWS provide is the most simple way: [AWSCloudFormationStackSetAdministrationRole.yml](https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetAdministrationRole.yml) and [AWSCloudFormationStackSetExecutionRole.yml](https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetExecutionRole.yml)
1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create StackSet" button
1. Provide the local account number and the regions to deploy to, then click the blue "Next" button
1. Select "Amazon S3 URL" and enter `https://gorillastack-autotag-releases.s3-ap-southeast-2.amazonaws.com/templates/autotag_event_collector-template.json`
1. Name the stack "AutoTag-Collector" - this name can be anything
1. In the parameter section:
* MainAwsRegion: The region where the main auto-tag CloudFormation stack will be running


## Supported Resource Types

Currently Auto-Tag, supports the following AWS resource types

WARNING: When tag-able resources are created using CloudFormation __StackSets__ the "Creator" tag is NEVER populated with the ARN of the user who executed the StackSet, instead it is tagged with the less useful CloudFormation StackSet Execution Role's "assumed-role" ARN. 

__Tags Applied__: C=Creator, T=Create Time, I=Invoked By

|Technology|Event Name|Tags Applied|IAM Deny Tag Support
|----------|----------|------------|----------------------
|AutoScaling Group|CreateAutoScalingGroup|C, T, I|Yes
|AutoScaling Group Instances w/ENI & Volume|RunInstances|C, T, I|Yes
|Data Pipeline|CreatePipeline|C, T, I|No
|DynamoDB Table|CreateTable|C, T, I|No
|EBS Volume|CreateVolume|C, T, I|Yes
|EC2 AMI *|CreateImage|C, T, I|Yes
|EC2 AMI *|CopyImage|C, T, I|Yes
|EC2 AMI *|ImportImage|C, T, I|Yes
|EC2 AMI *|RegisterImage|C, T, I|Yes
|EC2 Elastic IP|AllocateAddress|C, T, I|Yes
|EC2 ENI|CreateNetworkInterface|C, T, I|Yes
|EC2 Instance w/ENI & Volume|RunInstances|C, T, I|Yes
|EC2/VPC Security Group|CreateSecurityGroup|C, T, I|Yes
|EC2 Snapshot *|CreateSnapshot|C, T, I|Yes
|EC2 Snapshot *|CopySnapshot|C, T, I|Yes
|EC2 Snapshot *|ImportSnapshot|C, T, I|Yes
|Elastic Load Balancer (v1 & v2)|CreateLoadBalancer|C, T, I|No
|EMR Cluster|RunJobFlow|C, T, I|No
|IAM Role *?|CreateRole|C, T, I|?
|IAM User *?|CreateUser|C, T, I|?
|OpsWorks Stack|CreateStack|C (Propagated to Instances)|No
|OpsWorks Clone Stack *|CloneStack|C (Propagated to instances)|No
|OpsWorks Stack Instances w/ENI & Volume|RunInstances|C, T, I|Yes
|RDS Instance|CreateDBInstance|C, T, I|No
|S3 Bucket|CreateBucket|C, T, I|No
|NAT Gateway|CreateNatGateway||Yes
|VPC|CreateVpc|C, T, I|Yes
|VPC Internet Gateway|CreateInternetGateway|C, T, I|Yes
|VPC Network ACL|CreateNetworkAcl|C, T, I|Yes
|VPC Peering Connection|CreateVpcPeeringConnection|C, T, I|Yes
|VPC Route Table|CreateRouteTable|C, T, I|Yes
|VPC Subnet|CreateSubnet|C, T, I|Yes
|VPN Connection|CreateVpnConnection|C, T, I|Yes

_*=not tested by the test suite_


## Deny Create/Delete/Edit for AutoTags

Use the following IAM policy to deny a user or role the ability to create, delete, and edit any tag starting with 'AutoTag_'. At the time of this writing the deny tag IAM condition (aws:TagKeys) is only available for resources in EC2 and AutoScaling, see the table above for a status of each resource.

```json
{
  "Sid": "DenyAutoTagPrefix",
  "Effect": "Deny",
  "Action": [
    "ec2:CreateTags",
    "ec2:DeleteTags",
    "autoscaling:CreateOrUpdateTags",
    "autoscaling:DeleteTags"
  ],
  "Condition": {
    "ForAnyValue:StringLike": {
      "aws:TagKeys": "AutoTag_*"
    }
  },
  "Resource": "*"
}
```


## Retro-active Tagging

#### Query CloudTrail logs using AWS Athena

Use AWS Athena to scan your history of CloudTrail logs in S3 and retro-actively tag existing AWS resources. You are charged based on the amount the data that is scanned.

Create Table Query
```sql
CREATE EXTERNAL TABLE IF NOT EXISTS dev_cloudtrail (
eventversion STRING,
userIdentity STRUCT<
               type:STRING,
               principalid:STRING,
               arn:STRING,
               accountid:STRING,
               invokedby:STRING,
               accesskeyid:STRING,
               userName:STRING,
sessioncontext:STRUCT<
attributes:STRUCT<
               mfaauthenticated:STRING,
               creationdate:STRING>,
sessionIssuer:STRUCT<  
               type:STRING,
               principalId:STRING,
               arn:STRING, 
               accountId:STRING,
               userName:STRING>>>,
eventTime STRING,
eventSource STRING,
eventName STRING,
awsRegion STRING,
sourceIpAddress STRING,
userAgent STRING,
errorCode STRING,
errorMessage STRING,
requestParameters STRING,
responseElements STRING,
additionalEventData STRING,
requestId STRING,
eventId STRING,
resources ARRAY<STRUCT<
               ARN:STRING,
               accountId:STRING,
               type:STRING>>,
eventType STRING,
apiVersion STRING,
readOnly STRING,
recipientAccountId STRING,
serviceEventDetails STRING,
sharedEventID STRING,
vpcEndpointId STRING
)
ROW FORMAT SERDE 'com.amazon.emr.hive.serde.CloudTrailSerde'
STORED AS INPUTFORMAT 'com.amazon.emr.cloudtrail.CloudTrailInputFormat'
OUTPUTFORMAT 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat'
LOCATION 's3://my-cloudtrail-bucket/dev/AWSLogs/11111111111/'
```

Data Query

```sql
SELECT eventTime, eventSource, eventName, awsRegion, userIdentity.accountId as "userIdentity.accountId", recipientAccountId, "$path" as key, requestParameters, responseElements
FROM dev_cloudtrail
WHERE
eventName in (
    'AllocateAddress',
    'CloneStack',
    'CopyImage',
    'CopySnapshot',
    'CreateAutoScalingGroup',
    'CreateBucket',
    'CreateDBInstance',
    'CreateImage',
    'CreateInternetGateway',
    'CreateLoadBalancer',
    'CreateNatGateway',
    'CreateNetworkAcl',
    'CreateNetworkInterface',
    'CreatePipeline',
    'CreateRouteTable',
    'CreateSecurityGroup',
    'CreateSnapshot',
    'CreateStack',
    'CreateSubnet',
    'CreateTable',
    'CreateVolume',
    'CreateVpc',
    'CreateVpnConnection',
    'CreateVpcPeeringConnection',
    'ImportImage',
    'ImportSnapshot',
    'RegisterImage',
    'RunInstances',
    'RunJobFlow'
)
and eventSource in (
    'autoscaling.amazonaws.com',
    'datapipeline.amazonaws.com',
    'dynamodb.amazonaws.com',
    'ec2.amazonaws.com',
    'elasticloadbalancing.amazonaws.com',
    'elasticmapreduce.amazonaws.com',
    'opsworks.amazonaws.com',
    'rds.amazonaws.com',
    's3.amazonaws.com'
)
and errorcode is null
```

#### Tag Existing Resources

Use the `retro_tagging/retro_tag.rb` script to scan your environment for resources and then apply tagging to any resources that exist.

__TODO: add more information here__


## Contributing

If you have questions, feature requests or bugs to report, please do so on [the issues section of our github repository](https://github.com/GorillaStack/auto-tag/issues).

If you are interested in contributing, please get started by forking our github repository and submit pull-requests.
