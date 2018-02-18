#!/usr/bin/env ruby

require 'bundler/setup'
require 'cloudformation-ruby-dsl/cfntemplate'
require 'cloudformation-ruby-dsl/spotprice'
require 'cloudformation-ruby-dsl/table'

aws_accounts = nil

(0..(ARGV.length - 1)).each do |arg|
  next unless ARGV[arg] =~ /^-/
  case ARGV[arg]
    when '--aws-accounts'
      aws_accounts = ARGV[arg + 1]
  end
end

example = 'Example: ./autotag_event_main-template.rb expand --aws-accounts "123456789012, 789012345678" > autotag_event_main-template.json'

if aws_accounts.nil?
  puts 'Error: You must provide the argument "--aws-accounts" with a comma delimited list of AWS accounts IDs that you have already deployed the collector stack to.'
  puts example
  exit!
end

aws_accounts = aws_accounts.split(',').map(&:strip)

template do

  value AWSTemplateFormatVersion: '2010-09-09'

  value Description: 'Auto Tag (Open Source by GorillaStack)'

  parameter 'CodeS3Bucket',
            Description: 'The name of the code bucket in S3.',
            Type: 'String',
            Default: 'gorillastack-autotag-releases-ap-northeast-1'

  parameter 'CodeS3Path',
            Description: 'The path of the code zip file in the code bucket in S3.',
            Type: 'String',
            Default: 'autotag-0.3.0.zip'

  parameter 'AutoTagDebugLogging',
            Description: 'Enable/Disable Debug Logging for the Lambda Function for all processed CloudTrail events.',
            Type: 'String',
            AllowedValues: %w(Enabled Disabled),
            Default: 'Disabled'

  parameter 'AutoTagDebugLoggingOnFailure',
            Description: 'Enable/Disable Debug Logging when the Lambda Function has a failure.',
            Type: 'String',
            AllowedValues: %w(Enabled Disabled),
            Default: 'Enabled'

  parameter 'AutoTagTagsCreateTime',
            Description: 'Enable/Disable the "CreateTime" tagging for all resources.',
            Type: 'String',
            AllowedValues: %w(Enabled Disabled),
            Default: 'Enabled'

  parameter 'AutoTagTagsInvokedBy',
            Description: 'Enable/Disable the "InvokedBy" tagging for all resources.',
            Type: 'String',
            AllowedValues: %w(Enabled Disabled),
            Default: 'Enabled'


  resource 'AutoTagLambdaFunction', Type: 'AWS::Lambda::Function', Properties: {
    Code: {
      S3Bucket: ref('CodeS3Bucket'),
      S3Key: ref('CodeS3Path'),
    },
    Description: 'Auto Tag (Open Source by GorillaStack)',
    FunctionName: 'AutoTag',
    Handler: 'autotag_event.handler',
    Role: get_att('AutoTagExecutionRole', 'Arn'),
    Runtime: 'nodejs6.10',
    # the ec2 instance worker will wait for up to 45 seconds for a
    # opsworks stack or autoscaling group to be tagged with the creator
    # in case the events come out of order
    Timeout: 120,
    Environment: {
      Variables: {
        DEBUG_LOGGING_ON_FAILURE: ref('AutoTagDebugLoggingOnFailure'),
        DEBUG_LOGGING:            ref('AutoTagDebugLogging'),
        CREATE_TIME:              ref('AutoTagTagsCreateTime'),
        INVOKED_BY:               ref('AutoTagTagsInvokedBy')
      }
    }
  }

  resource 'AutoTagLogsMetricFilterMaxMemoryUsed', Type: 'AWS::Logs::MetricFilter', Properties: {
      FilterPattern: '[report_name="REPORT", request_id_name="RequestId:", request_id_value, duration_name="Duration:", duration_value, duration_unit="ms", billed_duration_name_1="Billed", bill_duration_name_2="Duration:", billed_duration_value, billed_duration_unit="ms", memory_size_name_1="Memory", memory_size_name_2="Size:", memory_size_value, memory_size_unit="MB", max_memory_used_name_1="Max", max_memory_used_name_2="Memory", max_memory_used_name_3="Used:", max_memory_used_value, max_memory_used_unit="MB"]',
      LogGroupName: join('', '/aws/lambda/', ref('AutoTagLambdaFunction')),
      MetricTransformations: [
          { MetricValue: '$max_memory_used_value',
            MetricNamespace: 'PGi/AutoTag',
            MetricName: join('-', aws_stack_name, 'AutoTag', 'MemoryUsed')
          }]
  }

  resource 'AutoTagExecutionRole', Type: 'AWS::IAM::Role', Properties: {
    RoleName: 'AutoTagLambda',
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Effect: 'Allow',
          Principal: {Service: ['lambda.amazonaws.com']},
          Action: ['sts:AssumeRole']
        }
      ]
    },
    Path: '/gorillastack/autotag/execution/'
  }

  resource 'AutoTagExecutionPolicy', Type: 'AWS::IAM::Policy', Properties: {
    PolicyName: 'AutoTagExecutionPolicy',
    Roles: [ref('AutoTagExecutionRole')],
    PolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: %w[logs:CreateLogGroup logs:CreateLogStream logs:PutLogEvents],
          Resource: 'arn:aws:logs:*:*:*'
        },
        {
          Effect: 'Allow',
          Action: ['cloudformation:DescribeStackResource'],
          Resource: [sub('arn:aws:cloudformation:${AWS::Region}:${AWS::AccountId}:stack/autotag/*')]
        },
        {
          Effect: 'Allow',
          Action: ['sts:*'],
          Resource: ['arn:aws:iam::*:role/gorillastack/autotag/master/AutoTag']
        }
      ]
    }
  }

  resource 'AutoTagMasterRole', Type: 'AWS::IAM::Role', Properties: {
    RoleName: 'AutoTag',
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Effect: 'Allow',
          Principal: {AWS: get_att('AutoTagExecutionRole', 'Arn')},
          Action: ['sts:AssumeRole'],
        }
      ]
    },
    Path: '/gorillastack/autotag/master/',
  }

  resource 'AutoTagMasterPolicy', Type: 'AWS::IAM::Policy', Properties: {
    PolicyName: 'AutoTagMasterPolicy',
    Roles: [ref('AutoTagMasterRole')],
    PolicyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: %w[
            autoscaling:CreateOrUpdateTags
            autoscaling:DescribeAutoScalingGroups
            autoscaling:DescribeAutoScalingInstances
            autoscaling:DescribeTags
            datapipeline:AddTags
            dynamodb:ListTagsOfResource
            dynamodb:TagResource
            ec2:CreateTags
            ec2:DescribeInstances
            elasticloadbalancing:AddTags
            elasticmapreduce:AddTags
            opsworks:DescribeInstances
            opsworks:DescribeStacks
            opsworks:ListTags
            opsworks:TagResource
            rds:AddTagsToResource
            s3:GetBucketTagging
            s3:PutBucketTagging
          ],
          Resource: ['*']
        }
      ]
    }
  }

  # all accounts provided in the args
  aws_accounts.each do |account|

    # all regions that exist according to the SDK
    Aws.partition('aws').regions.each do |region|
      region_description = region.description.sub(/.*\((.*)\)/, '\1').gsub(/[\.\s]+/, '')

      resource "TriggerLambdaPerm#{region_description}",
               Type: 'AWS::Lambda::Permission',
               DependsOn: 'AutoTagLambdaFunction',
               Properties: {
                 Action: 'lambda:InvokeFunction',
                 FunctionName: get_att('AutoTagLambdaFunction', 'Arn'),
                 Principal: 'sns.amazonaws.com',
                 SourceArn: "arn:aws:sns:#{region.name}:#{account}:AutoTag"
      }

    end

  end

end.exec!
