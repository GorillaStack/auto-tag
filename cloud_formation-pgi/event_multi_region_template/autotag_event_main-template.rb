#!/usr/bin/env ruby

require 'bundler/setup'
require 'cloudformation-ruby-dsl/cfntemplate'
require 'cloudformation-ruby-dsl/spotprice'
require 'cloudformation-ruby-dsl/table'

aws_accounts = nil
aws_region   = nil

(0..(ARGV.length - 1)).each do |arg|
  next unless ARGV[arg] =~ /^-/
  case ARGV[arg]
    when '-AwsAccounts'
      aws_accounts = ARGV[arg + 1]
    when '--region'
      aws_region = ARGV[arg + 1]
  end
end

example = 'Example: ./autotag_event_main-template.rb expand -AwsAccounts "123456789012, 789012345678" --region us-west-2 > autotag_event_main-template.json'

if aws_accounts.nil?
  puts 'Error: You must provide the argument "-AwsAccounts" with a comma delimited list of AWS accounts IDs that you have already deployed the collector stack to.'
  puts example
  exit!
elsif aws_region.nil?
  puts 'Error: If you don\'t provide the argument "--region" it will assume us-east-1.'
  puts example
  exit!
end

aws_accounts = aws_accounts.split(',').map(&:strip)

template do

  value AWSTemplateFormatVersion: '2010-09-09'

  value Description: 'Auto Tag (Open Source by GorillaStack)'

  parameter 'CodeS3Bucket',
            Description: 'The name of the code bucket in S3',
            Type: 'String',
            Default: 'gorillastack-autotag-releases-ap-northeast-1'

  parameter 'CodeS3Path',
            Description: 'The path of the code zip file in the code bucket in S3',
            Type: 'String',
            Default: 'autotag-0.3.0.zip'


  resource 'AutoTagLambdaFunction', Type: 'AWS::Lambda::Function', Properties: {
    Code: {
      S3Bucket: ref('CodeS3Bucket'),
      S3Key: ref('CodeS3Path'),
    },
    Description: 'Auto Tag (Open Source by GorillaStack)',
    FunctionName: 'AutoTag',
    Handler: 'autotag_event.handler',
    Role: get_att('AutoTagExecutionRole', 'Arn'),
    Runtime: 'nodejs4.3',
    Timeout: 60
  }

  resource 'AutoTagExecutionRole', Type: 'AWS::IAM::Role', Properties: {
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
          Resource: [join('', 'arn:aws:cloudformation:', aws_region, ':', aws_account_id, ':stack/autotag/*')]
        },
        {
          Effect: 'Allow',
          Action: ['sts:*'],
          Resource: [get_att('AutoTagMasterRole', 'Arn')]
        }
      ]
    }
  }

  resource 'AutoTagMasterRole', Type: 'AWS::IAM::Role', Properties: {
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
            datapipeline:AddTags
            ec2:CreateTags
            ec2:DescribeInstances
            elasticloadbalancing:AddTags
            elasticmapreduce:AddTags
            rds:AddTagsToResource
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
                 SourceArn: sub("arn:aws:sns:#{region.name}:#{account}:*AutoTagSNSTopic*")
               }

    end

  end

end.exec!
