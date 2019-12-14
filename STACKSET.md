## CloudFormation StackSet Deployment Method

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

### Installation

The friendly team at GorillaStack maintain hosted versions of the CloudFormation templates and Lambda code zip files, so deployment should be pretty straightforward.

The CloudFormation templates are available for use from any region.
Because AWS Lambda requires the S3 code location to be in the same region, we only have the code zip file in some supported regions (namely, "ap-southeast-2", "ap-southeast-1", "ap-northeast-1", "ap-northeast-2", "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "us-west-1", "us-west-2", "us-east-1", "us-east-2" and "ca-central-1").
We suggest that you deploy your main stack to one of these regions, however, if you want to still deploy to one of the regions we are not hosting the zip file, please feel free to download the artifacts and place them in your own bucket.

### StackSet Deployment Method: Deploy through the AWS CLI

__Main StackSet__

Deploy this stack set first in all desired accounts in a single "master" region. This stack is responsible for consuming events from each account it is deployed to, in all regions.

```bash
export REGION=ap-southeast-2 # set this to the region you plan to deploy to
wget https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/event_multi_region_template/autotag_event_main-template.json
aws cloudformation create-stack-set \
  --template-body file://autotag_event_main-template.json \
  --stack-set-name AutoTag \
  --region $REGION \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=CodeS3Bucket,ParameterValue=gorillastack-autotag-releases-$REGION \
      ParameterKey=CodeS3Path,ParameterValue=autotag-0.5.0.zip \
      ParameterKey=AutoTagDebugLogging,ParameterValue=Disabled \
      ParameterKey=AutoTagTagsCreateTime,ParameterValue=Enabled \
      ParameterKey=AutoTagTagsInvokedBy,ParameterValue=Enabled \
      ParameterKey=LogRetentionInDays,ParameterValue=90
# optionally list your stack sets
aws cloudformation list-stack-sets --region $REGION
# deploy the stack set across all accounts and regions you want
aws cloudformation create-stack-instances \
  --stack-set-name AutoTag \
  --region $REGION \
  --accounts '["account_ID_1","account_ID_2"]' \
  --regions "[\"$REGION\"]" \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=20
```

__Collector StackSet__

After the main stack status is CREATE_COMPLETE deploy the collector stack to each region where AWS resources should be tagged. This stack deploys the CloudWatch Event Rule and the SNS Topic.

```bash
wget https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/event_multi_region_template/autotag_event_collector-template.json
export REGION=ap-southeast-2 # set this to the region your ^ main stack is deployed in
# first create the stack set
aws cloudformation create-stack-set \
  --template-body file://autotag_event_collector-template.json \
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

### StackSet Deployment Method: Deploy through the AWS Console

__Main StackSet__

Deploy this stack set first in all desired accounts in a single "master" region. This stack is responsible for consuming events from each account it is deployed to, in all regions.

1. Read about the [CloudFormation StackSet Concepts](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-concepts.html)
1. Follow the instructions in the [CloudFormation StackSet Prerequisites](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-prereqs.html). To quickly deploy the requisite roles through the AWS CLI, [see the prerequisites section above](#prerequisites).
1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
tion drop-down button and select "Stack"
1. Click the blue "Create StackSet" button
1. Provide the local account number and the regions to deploy to, then click the blue "Next" button
1. Download the Main Stack CloudFormation Template: [autotag_event_main-template.json](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/event_multi_region_template/autotag_event_main-template.json)
1. Select "Upload a template file" and browse to the `autotag_event_main-template.json` file
1. Name the stack "AutoTag" - this name cannot be changed
1. In the parameter section:
* CodeS3Bucket: The name of the code bucket in S3 (i.e. `gorillastack-autotag-releases-${region-name}`)
* CodeS3Path: This is the version of AutoTag that you wish to deploy. The default value `autotag-0.5.0.zip` is the latest version
* AutoTagDebugLogging: Enable/Disable Debug Logging for the Lambda Function for **all** processed CloudTrail events
* AutoTagDebugLoggingOnFailure: Enable/Disable Debug Logging when the Lambda Function has a failure
* AutoTagTagsCreateTime: Enable/Disable the "CreateTime" tagging for all resources
* AutoTagTagsInvokedBy: Enable/Disable the "InvokedBy" tagging for all resources (when it is provided)
* LogRetentionInDays: Number of days to retain AutoTag logs
1. Select a single master region, and enter the accountIds that you want to deploy the StackSet to.

__Collector StackSet__

After the main stack status is CREATE_COMPLETE deploy the collector stack to each region where AWS resources should be tagged. This stack deploys the CloudWatch Event Rule and the SNS Topic.

1. Go to the [CloudFormation console](https://console.aws.amazon.com/cloudformation/home)
1. Click the blue "Create StackSet" button
1. Provide the local account number and the regions to deploy to, then click the blue "Next" button
1. Download the Main Stack CloudFormation Template: [autotag_event_collector-template.json](https://raw.githubusercontent.com/GorillaStack/auto-tag/master/cloud_formation/event_multi_region_template/autotag_event_collector-template.json)
1. Select "Upload a template file" and browse to the `autotag_event_collector-template.json` file
1. Name the stack "AutoTag-Collector" - this name can be anything
1. In the parameter section:
* MainAwsRegion: The region where the main auto-tag CloudFormation stack will be running
1. Select all regions, and enter the accountIds that you want to deploy the StackSet to.
