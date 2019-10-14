# Auto Tag

[![Build Status](https://img.shields.io/travis/GorillaStack/auto-tag/master.svg?style=for-the-badge)](https://travis-ci.org/GorillaStack/auto-tag)
[![Software License](https://img.shields.io/github/license/gorillastack/auto-tag.svg?style=for-the-badge)](/LICENSE.md)
![GitHub last commit](https://img.shields.io/github/last-commit/gorillastack/auto-tag.svg?style=for-the-badge)
[![Powered By: GorillaStack](https://img.shields.io/badge/powered%20by-GorillaStack-green.svg?style=for-the-badge)](https://www.gorillastack.com)

This is an open-source tagging solution for AWS. Deploy AutoTag to Lambda using CloudTrail consumed through CloudWatch Events and have each of your resources tagged with the ARN of who created it. Optionally, resources can be tagged with when it was created and which AWS service invoked the request if one is provided.  It was written by [GorillaStack](http://www.gorillastack.com/).

[Read a blog post about the project](http://blog.gorillastack.com/gorillastack-presents-auto-tag).

Also see [retro-tag](https://github.com/GorillaStack/retro-tag) for a solution to retrospectively tagging your resources using CloudTrail data.

## About

Automatically tagging resources can greatly improve the ease of cost allocation and governance.

CloudWatch events delivers a near real-time stream of CloudTrail events as soon as a supported resource type is created. CloudWatch event rules triggers our AutoTag code to tag the resource. In this configuration the Lambda function is executed once each time it is triggered by the CloudWatch Event Rule (one event at a time). The CloudWatch Event Rule includes a pattern filter so it is only triggered by the supported events, meaning fewer Lambda invocations and lower operational costs.

## Prerequisites

You will need at least 1 AWS Account, and CloudTrail should be enabled.

To make it as easy as possible to deploy across multiple regions and multiple accounts, we recommend deploying the AutoTag-Collector Stack as a [CloudFormation StackSet](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/what-is-cfnstacksets.html).

### Deploy Roles for StackSets via CloudFormation

If you have never used StackSets before, there are some IAM roles that are required for StackSets to assume in order to deploy across regions and accounts (more information on this [here](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-prereqs.html)). Follow the instructions below to set these up.

In the administrator account (the account from where you deploy your StackSets), you will need to deploy the [AWSCloudFormationStackSetAdministrationRole.yml](https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetAdministrationRole.yml). 

```bash
aws cloudformation create-stack --template-url https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetAdministrationRole.yml --stack-name cloudformation-stack-set-admin-role --capabilities CAPABILITY_NAMED_IAM --region $REGION
```

In each account you plan to use StackSets (or deploy AutoTag), you will need to deploy the [AWSCloudFormationStackSetExecutionRole.yml](https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetExecutionRole.yml).

```bash
aws cloudformation create-stack --template-url https://s3.amazonaws.com/cloudformation-stackset-sample-templates-us-east-1/AWSCloudFormationStackSetExecutionRole.yml --stack-name cloudformation-stack-set-execution-role --parameters ParameterKey=AdministratorAccountId,ParameterValue=$ADMIN_ACCOUNT_ID --capabilities CAPABILITY_NAMED_IAM --region $REGION
```

## Installation

The friendly team at GorillaStack maintain hosted versions of the CloudFormation templates and Lambda code zip files, so deployment should be pretty straightforward.

The CloudFormation templates are available for use from any region.
Because AWS Lambda requires the S3 code location to be in the same region, we only have the code zip file in some supported regions (namely, "ap-southeast-2", "ap-southeast-1", "ap-northeast-1", "ap-northeast-2", "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "us-west-1", "us-west-2", "us-east-1", "us-east-2" and "ca-central-1").
We suggest that you deploy your main stack to one of these regions, however, if you want to still deploy to one of the regions we are not hosting the zip file, please feel free to download the artifacts and place them in your own bucket.

### Option 1: Deploy through the AWS CLI

Deploy this stack set first in all desired accounts in a single "master" region. This stack is responsible for consuming events from each account it is deployed to, in all regions.

__Main StackSet__

```bash
export REGION=ap-southeast-2 # set this to the region you plan to deploy to
aws cloudformation create-stack-set \
  --template-url https://gorillastack-autotag-releases.s3-ap-southeast-2.amazonaws.com/templates/autotag_event_main-template.json \
  --stack-set-name AutoTag \
  --region $REGION \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=CodeS3Bucket,ParameterValue=gorillastack-autotag-releases-$REGION \
      ParameterKey=CodeS3Path,ParameterValue=autotag-0.5.0.zip \
      ParameterKey=AutoTagDebugLogging,ParameterValue=Disabled \
      ParameterKey=AutoTagTagsCreateTime,ParameterValue=Enabled \
      ParameterKey=AutoTagTagsInvokedBy,ParameterValue=Enabled
# optionally list your stack sets
aws cloudformation list-stack-sets --region $REGION
# deploy the stack set across all accounts and regions you want
aws cloudformation create-stack-instances \
  --stack-set-name AutoTag \
  --region $REGION \
  --accounts '["account_ID_1","account_ID_2"]' \
  --regions '["$REGION"]' \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=20
```

After the main stack status is CREATE_COMPLETE deploy the collector stack to each region where AWS resources should be tagged. This stack deploys the CloudWatch Event Rule and the SNS Topic.

__Collector StackSet__

```bash
export REGION=ap-southeast-2 # set this to the region your ^ main stack is deployed in
# first create the stack set
aws cloudformation create-stack-set \
  --template-url https://gorillastack-autotag-releases.s3-ap-southeast-2.amazonaws.com/templates/autotag_event_collector-template.json \
  --stack-set-name AutoTag-Collector \
  --region $REGION \
  --capabilities CAPABILITY_IAM \
  --parameters ParameterKey=MainAwsRegion,ParameterValue=$REGION
# optionally list your stack sets
aws cloudformation list-stack-sets --region $REGION
# deploy the stack set across all accounts and regions you want
aws cloudformation create-stack-instances \
  --stack-set-name AutoTag-Collector \
  --region $REGION \
  --accounts '["account_ID_1","account_ID_2"]' \
  --regions '["ap-southeast-2", "ap-south-1", "eu-west-3", "eu-west-2", "eu-west-1", "ap-northeast-2", "ap-northeast-1", "sa-east-1", "ca-central-1", "ap-southeast-1", "eu-central-1", "us-east-1", "us-east-2", "us-west-1", "us-west-2"]' \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=20
```

### Option 2: Deploy through the AWS Console

__Main StackSet__

Deploy this stack set first in all desired accounts in a single "master" region. This stack is responsible for consuming events from each account it is deployed to, in all regions.

1. Read about the [CloudFormation StackSet Concepts](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-concepts.html)
1. Follow the instructions in the [CloudFormation StackSet Prerequisites](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-prereqs.html). To quickly deploy the requisite roles through the AWS CLI, [see the prerequisites section above](#prerequisites).
1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
tion drop-down button and select "Stack"
1. Click the blue "Create StackSet" button
1. Provide the local account number and the regions to deploy to, then click the blue "Next" button
1. Select "Amazon S3 URL" and enter `https://gorillastack-autotag-releases.s3-ap-southeast-2.amazonaws.com/templates/autotag_event_main-template.json`
1. Name the stack "AutoTag" - this cannot be changed
1. In the parameter section:
* CodeS3Bucket: The name of the code bucket in S3 (i.e. `gorillastack-autotag-releases-${region-name}`)
* CodeS3Path: This is the version of AutoTag that you wish to deploy. The default value `autotag-0.5.0.zip` is the latest version
* AutoTagDebugLogging: Enable/Disable Debug Logging for the Lambda Function for **all** processed CloudTrail events
* AutoTagDebugLoggingOnFailure: Enable/Disable Debug Logging when the Lambda Function has a failure
* AutoTagTagsCreateTime: Enable/Disable the "CreateTime" tagging for all resources
* AutoTagTagsInvokedBy: Enable/Disable the "InvokedBy" tagging for all resources (when it is provided)
1. Select a single master region, and enter the accountIds that you want to deploy the StackSet to.

__Collector StackSet__

After the main stack status is CREATE_COMPLETE deploy the collector stack to each region where AWS resources should be tagged. This stack deploys the CloudWatch Event Rule and the SNS Topic.

1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create StackSet" button
1. Provide the local account number and the regions to deploy to, then click the blue "Next" button
1. Select "Amazon S3 URL" and enter `https://gorillastack-autotag-releases.s3-ap-southeast-2.amazonaws.com/templates/autotag_event_collector-template.json`
1. Name the stack "AutoTag-Collector" - this name can be anything
1. In the parameter section:
* MainAwsRegion: The region where the main auto-tag CloudFormation stack will be running
1. Select all regions, and enter the accountIds that you want to deploy the StackSet to.

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

## Contributing

If you have questions, feature requests or bugs to report, please do so on [the issues section of our github repository](https://github.com/GorillaStack/auto-tag/issues).

If you are interested in contributing, please get started by forking our GitHub repository and submit pull-requests.
