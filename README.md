# Auto Tag

[![Build Status](https://travis-ci.org/GorillaStack/auto-tag.svg?branch=master)](https://travis-ci.org/GorillaStack/auto-tag)

This is an open-source tagging solution for AWS.  Deploy AutoTag to lambda and set up CloudTrail for s3 logs, or cloudwatch events, and have each of your resources tagged with the resource who created it. Also optionally, resources can be tagged with when it was created and what service invoked the request if one is provided.  It was written by [GorillaStack](http://www.gorillastack.com/).

[Read a blog post about the project](http://blog.gorillastack.com/gorillastack-presents-auto-tag).

## About

Automatically tagging resources can greatly improve the ease of cost allocation and governance.

Two options are available to process the CloudTrail event stream, a S3 put object trigger on the associated CloudTrail S3 bucket, or a CloudWatch Events rule trigger. 

CloudTrail logs (S3 objects) are delivered in batches to the CloudTrail S3 bucket every 5 to 7 minutes after a supported resource type is created. CloudTrail will write the S3 logs which triggers our AutoTag code to tag the resource. The lambda function is executed once for each S3 object, each S3 object log contains a batch of CloudTrail Events to be processed. Every event in the log must be processed, even if it is not supported. This can be a quick solution if CloudTrail is already enabled for all region and accounts. 

CloudWatch events delivers a near real-time stream of CloudTrail events as soon as a supported resource type is created. CloudWatch event rules triggers our AutoTag code to tag the resource. This method does not require CloudTrail logs to be sent to a s3 bucket. In this configuration the lambda function is executed once each time it is triggered by the CloudWatch Event Rule. The CloudWatch Event Rule has includes a pattern filter so it is only triggered by the supported events which is much more efficient. I saw about an 85% decrease in invocations of the lambda function. 

There are two separate CloudFormation templates for CloudWatch Events, the first is a simple template setup that will only function for a single region. In this solution CloudWatch events can trigger the lambda function directly because they are in the same region. The second option is a multi-region and multi-account solution, here the CloudWatch events are delivered to in-region SNS topics and then the SNS topic delivers that event to the main lambda function. There is no limit to the amount of regions and accounts you can use and only requires a single lambda function. 

## Installation

We have [created a CloudFormation template](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/template.json) that creates all the resources required for AutoTag.

~~We also host each release of AutoTag in public s3 buckets in each region, such that all you have to do is install the CloudFormation template.~~

### Settings

Edit the `src/cloud_trail_event_settings.js` to change settings for debug logging and the optional tags, "create time" and "invoked by".

__Fields__
* DebugLogging: Log **all** CloudTrail events processed
* AutoTags/CreateTime: Tag the `AutoTag_CreateTime` on all resources
* AutoTags/InvokedBy: Tag the `AutoTag_InvokedBy` on all resources (when it is provided)

__Defaults__
```javascript
DebugLogging: false,
  AutoTags: {
    CreateTime: true,
    InvokedBy: true
  }
```

### Generate the Lambda zip package

### Pick a Deployment Method
#### Deploy with Console (S3 Object Method)

1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create Stack" button
1. Select "Upload a template to Amazon S3", choosing the downloaded [CloudFormation template](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/s3object_template/autotag_s3object-template.json), then click the blue "Next" button
1. Name the stack "autotag" - this part is important, as the autotag code need to find the created resources through the API
1. In the parameter section:
  * CloudTrailBucketName: Name the S3 bucket that the template will create.  This needs to be unique for the region, so select something specific
  * CodeS3Bucket: The name of the code bucket in S3 ~~As mentioned, we have a version of AutoTag in each region, to make deployment easy regardless of what region you are deploying your CloudFormation template.  Edit this parameter to match your region.  It should have the following pattern: gorillastack-autotag-releases-${regionId}.  E.g. gorillastack-autotag-releases-ap-northeast-1, gorillastack-autotag-releases-us-west-2~~
  * CodeS3Path: This is the version of AutoTag that you wish to deploy.  The default value `autotag-0.3.0.zip` is the latest version
  
  
#### Deploy with Console (CloudWatch Events Method - Single Region)

1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create Stack" button
1. Select "Upload a template to Amazon S3", choosing the downloaded [CloudFormation template](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/event_single_region_template/autotag_event-template.json), then click the blue "Next" button
1. Name the stack "autotag" - this part is important, as the autotag code need to find the created resources through the API
1. In the parameter section:
* CodeS3Bucket: The name of the code bucket in S3
* CodeS3Path: This is the version of AutoTag that you wish to deploy.  The default value `autotag-0.3.0.zip` is the latest version
  
#### Deploy with Console (CloudWatch Events Method - Multi-Region & Multi-Account)

__CloudFormation Collector StackSet__ (Warning: Extra setup is required for deploying StackSets) - Deploy this stack in every account and region where we want to tag resources. It deploys the CloudWatch Event Rule and the SNS Topic.
1. Read about the [CloudFormation StackSet Concepts](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-concepts.html)
1. Follow the instructions in the [CloudFormation StackSet Prerequisites](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-prereqs.html) - even if you are only deploying this in one account you will need to setup the StackSet IAM permissions. Using the two templates AWS provide is the most simple way: [AWSCloudFormationStackSetAdministrationRole.yml](https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetAdministrationRole.yml) and [AWSCloudFormationStackSetExecutionRole.yml](https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetExecutionRole.yml)
1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create StackSet" button
1. Provide the account numbers and regions to deploy to, then click the blue "Next" button - the resulting deployment with be a combination of both the accounts and regions
1. Select "Upload a template to Amazon S3", choosing the downloaded [CloudFormation template](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/event_multi_region_template/autotag_event_collector-template.json), then click the blue "Next" button
1. Name the stack "autotag-collector" - this can be anything
1. In the parameter section:
* MainAwsAccountNumber: The account number where the main auto-tag CloudFormation stack will be running
* MainAwsRegion: The region where the main auto-tag CloudFormation stack will be running
* SubscriberEmail: The subscriber email for debugging - it will only email to ask you to subscribe, but you don't have to confirm.

__CloudFormation Main Stack__ - Deploy this stack in a single "master" region. This stack deploys the lambda function and permissions for each region. (note: this requires an up-to-date ruby SDK to be aware of the latest regions)

1. In the git files on your local machine change directory to `cloud_formation/event_multi_region_template`
1. The next step requires a install of ruby and bundler
1. Run `bundle install` to install the ruby dependencies to build the template
1. Run the template builder specifying the AWS account numbers where you have deployed the collector stack `./autotag_event_main-template.rb expand --aws-accounts "123456789012, 789012345678" > autotag_event_main-template.json`
1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the CloudFormation drop-down button and select "Stack"
1. Click the blue "Create Stack" button
1. Select "Upload a template to Amazon S3", choosing the `autotag_event_main-template.json` that we created in the ruby template builder step, then click the blue "Next" button
1. Name the stack "autotag" - this part is important, as the autotag code need to find the created resources through the API
1. In the parameter section:
* CodeS3Bucket: The name of the code bucket in S3
* CodeS3Path: This is the version of AutoTag that you wish to deploy.  The default value `autotag-0.3.0.zip` is the latest version

__CloudFormation Master Role StackSet__ - This stack is required to utilize more than one AWS account. This stack deploys the Master IAM Role that is assumed by the main stack lambda function. This role allows the lambda function in the main stack account to perform the tagging in a different account. 

1. Update the StackSet administration role in the administrator account [AWSCloudFormationStackSetAdministrationRole.yml](https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetAdministrationRole.yml)
1. Install the StackSet execution role in the remote account [AWSCloudFormationStackSetExecutionRole.yml](https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetExecutionRole.yml)
1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create StackSet" button
1. Provide the account numbers and select a single region to deploy to (can be any region), then click the blue "Next" button - we only need the role once in each remote account
1. Select "Upload a template to Amazon S3", choosing the downloaded [CloudFormation template](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/event_multi_region_template/autotag_event_role-template.json), then click the blue "Next" button
1. Name the stack "autotag-role" - this can be anything
1. In the parameter section:
* MainAwsAccountNumber: The account number where the main auto-tag CloudFormation stack will be running

## Supported Resource Types

Currently Auto Tag, supports the following resource types in AWS 

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

Use the following IAM policy to deny a user or role the ability to create, delete, and edit any tag starting with 'AutoTag_'. This ability is only available for resources in EC2 and AutoScaling, see the table above.

```json
{
  "Sid": "DenyAutoTagPrefix",
  "Effect": "Deny",
  "Action": [
    "ec2:CreateTags",
    "ec2:DeleteTags"
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



## Contributing

If you have questions, feature requests or bugs to report, please do so on [the issues section of our github repository](https://github.com/GorillaStack/auto-tag/issues).

If you are interested in contributing, please get started by forking our github repository and submit pull-requests.

### Development guide

#### General

Auto tag is implemented in Javascript (ECMAScript 2015 - a.k.a. es6).

When the repository was first authored, this was not supported by the lambda node version (v0.10).  [Even now with version 4.3 support](https://aws.amazon.com/blogs/compute/node-js-4-3-2-runtime-now-available-on-lambda/), we still need to transpile code to es5 for compatibility, as not all language features are available (e.g. import etc).

I've set the templates to use [nodejs 6.10](https://aws.amazon.com/about-aws/whats-new/2017/03/aws-lambda-supports-node-js-6-10/), but I'm not sure if we can run this code natively yet... -ray


##### Test Suite

Use the test suite to deploy in your own environment and validate the auto-tagging for most of the supported resources. A CloudFormation stack will deploy the taggable resources, then use the audit script to validate whether the appropriate tags were applied.

The user (arn) who deploys the CloudFormation script needs to be the same user who runs the `audit_test_tags.rb` script for the automated check to work. If the users aren't the same, use the `--user-arn` argument to set the expected ARN. 


##### Support for es5

If you still wish to transpile to es5 for older node versions run the following:

```bash
$ grunt run:babel  # runs interactively, issue ^C to existing
```

Export the generated es5 `lib/` directory to AWS rather than the es6 `src/` directory.
