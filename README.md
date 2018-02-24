# Auto Tag

[![Build Status](https://travis-ci.org/GorillaStack/auto-tag.svg?branch=master)](https://travis-ci.org/GorillaStack/auto-tag)

This is an open-source tagging solution for AWS.  Deploy AutoTag to lambda and set up CloudTrail for s3 logs, or CloudWatch Events, and have each of your resources tagged with the resource who created it. Optionally, resources can be tagged with when it was created and which AWS service invoked the request if one is provided.  It was written by [GorillaStack](http://www.gorillastack.com/).

[Read a blog post about the project](http://blog.gorillastack.com/gorillastack-presents-auto-tag).


## About

Automatically tagging resources can greatly improve the ease of cost allocation and governance.

Two options are available to process the CloudTrail event stream, a S3 put object trigger on the associated CloudTrail S3 bucket, or a CloudWatch Events rule trigger. 

CloudTrail logs (S3 objects) are delivered in batches to the CloudTrail S3 bucket every 5 to 7 minutes after a supported resource type is created. CloudTrail will write the S3 logs which triggers our AutoTag code to tag the resource. The lambda function is executed once for each S3 object, each S3 object log contains a batch of CloudTrail Events to be processed. Every event in the log must be processed, even if it is not supported. This can be a quick solution if CloudTrail is already enabled for all region and accounts. 

CloudWatch events delivers a near real-time stream of CloudTrail events as soon as a supported resource type is created. CloudWatch event rules triggers our AutoTag code to tag the resource. This method does not require CloudTrail logs to be sent to a S3 bucket. In this configuration the lambda function is executed once each time it is triggered by the CloudWatch Event Rule. The CloudWatch Event Rule includes a pattern filter so it is only triggered by the supported events which is much more efficient. I saw about an 85% decrease in invocations of the lambda function. 

There are two separate CloudFormation templates for CloudWatch Events, the first is a simple template setup that will only function for a single region. In this solution CloudWatch events can trigger the lambda function directly because they are in the same region. The second option is a multi-region  single account solution, here the CloudWatch events are delivered to in-region SNS topics and then the SNS topic delivers that event to the main lambda function in the main region. Any number of regions can be setup for tagging and it only needs a single lambda function per account. 


## Installation

### Generate the Lambda zip package
#### Redhat 7.4

```bash
cd ~
curl "https://bootstrap.pypa.io/get-pip.py" -o "get-pip.py"
sudo python get-pip.py
sudo pip install awscli
sudo yum -y install gcc-c++ make git zip
sudo curl -sL https://rpm.nodesource.com/setup_8.x | sudo -E bash -
sudo yum -y install nodejs
sudo npm install grunt-cli -g
git clone https://github.com/GorillaStack/auto-tag.git
cd auto-tag
npm install --save
mv node_modules/ lib/
npm install grunt-run --save-dev
cd lib/
grunt run:babel-once 
zip -r9 auto-tag-0.9.0.zip -x\*.zip * -q
```

### Pick a Deployment Method
#### Deploy with Console (S3 Object Method)

1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create Stack" button
1. Select "Upload a template to Amazon S3", choosing the downloaded [CloudFormation template](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/s3object_template/autotag_s3object-template.json), then click the blue "Next" button
1. Name the stack "AutoTag" - this name can be anything
1. In the parameter section:
  * CloudTrailBucketName: Name the S3 bucket that the template will create.  This needs to be unique for the region, so select something specific
  * CodeS3Bucket: The name of the code bucket in S3 ~~As mentioned, we have a version of AutoTag in each region, to make deployment easy regardless of what region you are deploying your CloudFormation template.  Edit this parameter to match your region.  It should have the following pattern: gorillastack-autotag-releases-${regionId}.  E.g. gorillastack-autotag-releases-ap-northeast-1, gorillastack-autotag-releases-us-west-2~~
  * CodeS3Path: This is the version of AutoTag that you wish to deploy.  The default value `autotag-0.3.0.zip` is the latest version
  * AutoTagDebugLogging: Enable/Disable Debug Logging for the Lambda Function for **all** processed CloudTrail events
  * AutoTagDebugLoggingOnFailure: Enable/Disable Debug Logging when the Lambda Function has a failure
  * AutoTagTagsCreateTime: Enable/Disable the "CreateTime" tagging for all resources
  * AutoTagTagsInvokedBy: Enable/Disable the "InvokedBy" tagging for all resources (when it is provided)
  
  
#### Deploy with Console (CloudWatch Events Method - Single Region)

1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create Stack" button
1. Select "Upload a template to Amazon S3", choosing the downloaded [CloudFormation template](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/event_single_region_template/autotag_event-template.json), then click the blue "Next" button
1. Name the stack "AutoTag" - this name can be anything
1. In the parameter section:
* CodeS3Bucket: The name of the code bucket in S3
* CodeS3Path: This is the version of AutoTag that you wish to deploy.  The default value `autotag-0.3.0.zip` is the latest version
* AutoTagDebugLogging: Enable/Disable Debug Logging for the Lambda Function for **all** processed CloudTrail events
* AutoTagDebugLoggingOnFailure: Enable/Disable Debug Logging when the Lambda Function has a failure
* AutoTagTagsCreateTime: Enable/Disable the "CreateTime" tagging for all resources
* AutoTagTagsInvokedBy: Enable/Disable the "InvokedBy" tagging for all resources (when it is provided)  


#### Deploy with Console (CloudWatch Events Method - Multi-Region)


__CloudFormation Main Stack__ Deploy this stack first in a single "master" region. This stack deploys the lambda function and permissions for each region. (note: this requires an up-to-date ruby SDK to be aware of the latest regions)

1. In the git files on your local machine change directory to `cloud_formation/event_multi_region_template`
1. The next step requires a install of ruby and bundler
1. Run `bundle install` to install the ruby dependencies to build the template
1. Running the ruby template builder helps to build a Lambda::InvokePermission for each region (SDK version dependent) `./autotag_event_main-template.rb expand > autotag_event_main-template.json`
1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the CloudFormation drop-down button and select "Stack"
1. Click the blue "Create Stack" button
1. Select "Upload a template to Amazon S3", choosing the `autotag_event_main-template.json` that was created in the ruby template builder step, then click the blue "Next" button
1. Name the stack "AutoTag" - can be anything
1. In the parameter section:
* CodeS3Bucket: The name of the code bucket in S3
* CodeS3Path: This is the version of AutoTag that you wish to deploy.  The default value `autotag-0.3.0.zip` is the latest version
* AutoTagDebugLogging: Enable/Disable Debug Logging for the Lambda Function for **all** processed CloudTrail events
* AutoTagDebugLoggingOnFailure: Enable/Disable Debug Logging when the Lambda Function has a failure
* AutoTagTagsCreateTime: Enable/Disable the "CreateTime" tagging for all resources
* AutoTagTagsInvokedBy: Enable/Disable the "InvokedBy" tagging for all resources (when it is provided)
  
  
__CloudFormation Collector StackSet__ After the main stack status is CREATE_COMPLETE deploy the collector stack to each region where AWS resources should be tagged. This stack deploys the CloudWatch Event Rule and the SNS Topic. (Note: Extra setup is required for deploying StackSets. Using StackSets is not actually necessary for this step, it is just a simple way to deploy CloudFormation templates to multiple regions.)
1. Read about the [CloudFormation StackSet Concepts](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-concepts.html)
1. Follow the instructions in the [CloudFormation StackSet Prerequisites](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-prereqs.html) Using the two templates AWS provide is the most simple way: [AWSCloudFormationStackSetAdministrationRole.yml](https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetAdministrationRole.yml) and [AWSCloudFormationStackSetExecutionRole.yml](https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetExecutionRole.yml)
1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create StackSet" button
1. Provide the local account number and the regions to deploy to, then click the blue "Next" button
1. Select "Upload a template to Amazon S3", choosing the downloaded [CloudFormation template](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/event_multi_region_template/autotag_event_collector-template.json), then click the blue "Next" button
1. Name the stack "AutoTag-Collector" - this name can be anything
1. In the parameter section:
* MainAwsRegion: The region where the main auto-tag CloudFormation stack will be running



## Supported Resource Types

Currently Auto Tag, supports the following resource types in AWS 

Note: When tag-able resources are created using CloudFormation __StackSets__ the "Creator" tag is NEVER populated with the ARN of the user who executed the StackSet, instead it is tagged with the less useful CloudFormation StackSet Execution Role's "assumed-role" ARN. 

__Tags Applied__: C=Creator, T=Create Time, I=Invoked By

|Technology|Event Name|Tags Applied|IAM Deny Tag Support
|----------|----------|------------|----------------------
|AutoScaling Group|CreateAutoScalingGroup|C, T, I|Yes
|AutoScaling Group Instances w/ENI & Volume|RunInstances|C, T, I|Yes
|Data Pipeline|CreatePipeline|C, T, I|No
|DynamoDB Table|CreateTable|C, T, I|No
|EBS Volume|CreateVolume|C, T, I|Yes
|EC2 AMI *|CreateImage|C, T, I|Yes
|EC2 Elastic IP|AllocateAddress|C, T, I|Yes
|EC2 ENI|CreateNetworkInterface|C, T, I|Yes
|EC2 Instance w/ENI & Volume|RunInstances|C, T, I|Yes
|EC2/VPC Security Group|CreateSecurityGroup|C, T, I|Yes
|EC2 Snapshot *|CreateSnapshot|C, T, I|Yes
|Elastic Load Balancer (v1 & v2)|CreateLoadBalancer|C, T, I|No
|EMR Cluster|RunJobFlow|C, T, I|No
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


## IAM Deny Tag Support

Use the following IAM policy to deny a user or role the ability to create, delete, and edit any tag starting with 'AutoTag_'. At the time of this writing the deny tag IAM condition is only available for resources in EC2 and AutoScaling, see the table above.

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

Use AWS Athena to scan your history of CloudTrail logs and retro-actively tag existing AWS resources.

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

Use the `retro_tagging/retro_tag.rb` script to scan your environment for resources and then apply tagging to any resources that exist.

## Test Suite

Use the test suite in your own environment to deploy a minimal set of AWS resources to validate the auto-tagging functionality. A CloudFormation stack will deploy the tag-able resources, then use the audit script to validate whether the appropriate tags were applied.

For the `AutoTag_Creator` tag validation to work the user (ARN) who deploys the test suite's CloudFormation template needs to be the same user who runs the `audit_test_tags.rb` script. If the user's ARNs are not the same, use the `--user-arn` argument in the audit script to set the expected ARN. (see [Deploy the test suite](#audit-the-test-suite-resources))

#### Deploy the test suite

The suite deploy several resources that have a cost, the resource have been minimized but there are some requirements that are unavoidable. The following are the more major resources: DataPipeline (t2.nano), OpsWorks Instance (m3.medium), NAT Gateway, EMR Cluster (2x c1.medium - TODO: this is the most expensive, need to look at this again.), RDS Instance (t2.micro), Classic ELB, Network ELB, EC2 Instance (t2.nano), AutoScaling Group Instance (t2.nano). Estimations from 1/29/2018 for us-east-1 add up to about $0.39/hr at on-demand pricing. The suite can be deployed to a single region or multiple regions. For multiple-regions omit the `--region` argument in each script to prepare _all_ regions, then deploy the CloudFormation template as a Stack (not a StackSet!) to as many regions as necessary using the included ruby script. (Note: all regions have not been tested, does not work in us-west-1, ca-central-1, or eu-west-2 due to a lack of the DataPipeline service) (tested successfully in us-east-1, us-west-2, eu-west-1, ap-southeast-2)

1. Create a new KeyPair for import to AWS.
   1. Execute `ssh-keygen -t rsa -C "KeyPair-Dev-20180116" -b 4096 -f “KeyPair-Dev-20180116”`
   1. Execute `openssl rsa -in KeyPair-Dev-20180116 -text > KeyPair-Dev-20180116.pem`
1. Change directory to `auto-tag/test_suite` and execute `bundle install` to grab the dependent gems
1. Deploy a key pair for the test: `./deploy_key.rb --region us-east-1 --profile default --key-name KeyPair-Dev-20180116 --key-file /Projects/AutoTag/key-pair/KeyPair-Dev-20180116.pub`
   1. Omitting the `--region` argument will add the key pair to all regions
1. Deploy the SSM store parameters that will be used by the CloudFormation template for the test: `./deploy_ssm_params.rb --region us-east-1 --profile default --key-name KeyPair-Dev-20180116 --cidr "192.168"`
   1. Omitting the `--region` argument will add the test suite SSM params to all regions
   1. The `--cidr` argument is optional
   1. The SSM Store Parameter Names: /AutoTagTest/KeyName, /AutoTagTest/AmiImageId, /AutoTagTest/VpcCidrBlock /AutoTagTest/SubnetCidrBlocks, /AutoTagTest/VpcCidrBlockForVpcPeering
1. Deploy the CloudFormation test suite stack template: `./deploy_cloudformation.rb --regions us-east-1,us-west-2,eu-west-1,ap-southeast-2 --profile default `
   1. The `--action` argument is required, allowed values are 'create' or 'delete'
   1. The `--stack` argument is optional, it defaults to 'AutoTag-Test'
   1. The `--regions` argument will take a list of regions, it is optional and will default to 'us-east-1'
   1. (Note) If the ruby dsl template needs to be edited issuing a "create" action against the `deploy_cloudformation.rb` script will re-generate the associated json file. This can also be done manually with `bundle install && ./autotag_event_test.rb expand > autotag_event_test.json` in the `test_suite-cloud_formation` directory

#### Audit the test suite resources

1. Change directory to `auto-tag/test_suite`
1. Audit the tags  `./audit_test_tags.rb  --region us-east-1 --profile default --stack-name AutoTag-Test --user-arn <aws-arn>`
   1. Omitting the `--region` argument will scan all regions for CloudFormation stand and audit the tags in any matching stacks
   1. The `--stack-name` and `--user-arn` arguments are optional
1. When finished, delete the "AutoTag-Test" CloudFormation stack


## Contributing

If you have questions, feature requests or bugs to report, please do so on [the issues section of our github repository](https://github.com/GorillaStack/auto-tag/issues).

If you are interested in contributing, please get started by forking our github repository and submit pull-requests.


### Development guide

#### General

Auto tag is implemented in Javascript (ECMAScript 2015 - a.k.a. es6).

When the repository was first authored, this was not supported by the lambda node version (v0.10).  [Even now with version 4.3 support](https://aws.amazon.com/blogs/compute/node-js-4-3-2-runtime-now-available-on-lambda/), we still need to transpile code to es5 for compatibility, as not all language features are available (e.g. import etc)...[with nodejs 6.10](https://aws.amazon.com/about-aws/whats-new/2017/03/aws-lambda-supports-node-js-6-10/) we still can't run this code natively.


##### Support for es5

If you still wish to transpile to es5 for older node versions run the following:

```bash
$ grunt run:babel  # runs interactively, issue ^C to existing
```

Export the generated es5 `lib/` directory to AWS rather than the es6 `src/` directory.
