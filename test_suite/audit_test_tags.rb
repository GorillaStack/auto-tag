#!/usr/bin/env ruby

require 'aws-sdk'
require 'pp'
require 'pastel'
require 'tty-spinner'
require './audit_test_tags_include'


pastel  = Pastel.new
title   = pastel.bright_white.bold.underline.detach
heading = pastel.blue.bold.detach
$error  = pastel.red.detach

require 'docopt'
doc = <<DOCOPT
Audit the tags created by the Auto Tag Test Suite

Usage:
  #{__FILE__} [--region=REGION] [--profile=PROFILE]
                [--details] [--stack=STACK_NAME]
                [--user-arn=USER_ARN]
  #{__FILE__} -h | --help

Options:
  -h --help                   Show this screen.
  -d --details                Show details for all resources.
  --region=REGION             The AWS Region where the stack exists, required if using a StackSet, defaults to scan all regions for Stacks only.
  --profile=PROFILE           The AWS credential profile.
  --stack=STACK_NAME          The CloudFormation stack name, defaults to "AutoTag-Test".
  --user-arn=USER_ARN         The IAM user that executed the CloudFormation template, defaults to the local user's arn.

DOCOPT

begin
  $args = Docopt::docopt(doc)
rescue Docopt::Exit => e
  puts e.message
end


aws_region      = $args['--region']    ? $args['--region']    : nil
aws_profile     = $args['--profile']   ? $args['--profile']   : 'default'
stack_name      = $args['--stack']     ? $args['--stack']     : 'AutoTag-Test'
credentials     = Aws::SharedCredentials.new(profile_name: aws_profile)


# all regions that exist according to the SDK
Aws.partition('aws').regions.each do |region|
  region_name = region.name
  next unless region_name == aws_region unless aws_region.nil?
  $spinner = TTY::Spinner.new(':spinner :title', format: :bouncing_ball)
  $results_bad, $results_good = [], []

  aws_regions = Aws.partition('aws').regions
  region_description = aws_regions.select { |r| r.name == region_name }
  region_description = region_description.first.description.sub!(/.*\((.*)\)/, '\1')

  puts "**** #{title.call("#{region_name} (#{region_description})")} ****" if $args['--details']

  cfn = Aws::CloudFormation::Client.new(region: region_name, credentials: credentials)
  iam = Aws::IAM::Client.new(region: region_name, credentials: credentials)

  begin
    describe_stack_resources = Tags.describe_stack_resources(cfn, stack_name)
  rescue Aws::CloudFormation::Errors::ValidationError
    puts "Stack #{stack_name} in #{region_name} not found..."
    next
  end

  describe_stacks    = Tags.describe_stacks(cfn, stack_name)
  stack_resources    = describe_stack_resources.stack_resources.select do |resource|
    %w[CREATE_IN_PROGRESS
      CREATE_COMPLETE
      UPDATE_IN_PROGRESS
      UPDATE_COMPLETE].include? resource['resource_status']
  end

  ec2          = Aws::EC2::Client.new(region: region_name, credentials: credentials)
  autoscaling  = Aws::AutoScaling::Client.new(region: region_name, credentials: credentials)
  datapipeline = Aws::DataPipeline::Client.new(region: region_name, credentials: credentials)
  elbv1        = Aws::ElasticLoadBalancing::Client.new(region: region_name, credentials: credentials)
  elbv2        = Aws::ElasticLoadBalancingV2::Client.new(region: region_name, credentials: credentials)
  rds          = Aws::RDS::Client.new(region: region_name, credentials: credentials)
  s3           = Aws::S3::Client.new(region: region_name, credentials: credentials)
  emr          = Aws::EMR::Client.new(region: region_name, credentials: credentials)
  dynamodb     = Aws::DynamoDB::Client.new(region: region_name, credentials: credentials)
  opsworks     = Aws::OpsWorks::Client.new(region: 'us-east-1', credentials: credentials)

  skipped_resource_types = %w[
      AWS::AutoScaling::LaunchConfiguration
      AWS::EC2::CustomerGateway
      AWS::EC2::Route
      AWS::EC2::SubnetRouteTableAssociation
      AWS::EC2::VPCGatewayAttachment
      AWS::EC2::VPNGateway
      AWS::IAM::InstanceProfile
      AWS::IAM::Role
      AWS::OpsWorks::Instance
      AWS::OpsWorks::Layer
      AWS::RDS::DBSubnetGroup
  ]

  stack_resources.each_with_index do |resource, idx|
    next if resource['resource_type'] == 'AWS::EC2::VPC'        and resource['logical_resource_id'] == 'AutoTagTestVPCForVpcPeering'
    next if resource['resource_type'] == 'AWS::EC2::RouteTable' and resource['logical_resource_id'] == 'AutoTagTestRouteTableIGW'
    next if resource['resource_type'] == 'AWS::EC2::Subnet'     and resource['logical_resource_id'] == 'AutoTagTestSubnetIGW'
    next if resource['resource_type'] == 'AWS::EC2::Subnet'     and resource['logical_resource_id'] == 'AutoTagTestSubnetNAT2'

    if !$args['--details'] and !$spinner.spinning?
      $spinner.start
      $spinner.spin
    end

    if $spinner.spinning?
      resources_left = stack_resources.count - (idx + 1)
      $spinner.update(title: "Gathering tags from #{resource['logical_resource_id']} in #{region_name}, #{resources_left} resources left...")
      $spinner.spin
    end

    if $args['--details'] and !skipped_resource_types.include? resource['resource_type']
      puts heading.call(resource['logical_resource_id']).to_s
    end

    case resource['resource_type']

    when 'AWS::EC2::VPC', 'AWS::EC2::Volume', 'AWS::EC2::SecurityGroup', 'AWS::EC2::Instance',
          'AWS::EC2::Subnet', 'AWS::EC2::EIP', 'AWS::EC2::InternetGateway', 'AWS::EC2::NetworkInterface',
          'AWS::EC2::NatGateway', 'AWS::EC2::NetworkAcl', 'AWS::EC2::RouteTable',
          'AWS::EC2::VPCPeeringConnection', 'AWS::EC2::VPNConnection'

      Tags.process_ec2_resource(ec2, resource['physical_resource_id'], resource['resource_type'], region_name)

    when 'AWS::AutoScaling::AutoScalingGroup'
      list_tags = Tags.describe_autoscaling_tags(autoscaling, resource)
      auto_tags = Tags.extract_auto_tags(list_tags)
      Tags.validate_tags(auto_tags, resource['physical_resource_id'], region_name)

      # check the instances within the auto scaling group
      if $args['--details'] and !skipped_resource_types.include? resource['resource_type']
        puts heading.call("#{resource['logical_resource_id']}-Instances").to_s
      end

      describe_auto_scaling_groups = Tags.describe_auto_scaling_groups(autoscaling, resource)
      if describe_auto_scaling_groups.auto_scaling_groups.count > 0
        describe_auto_scaling_groups.auto_scaling_groups.first.instances.each do |instance|
          Tags.process_ec2_resource(ec2, instance['instance_id'], 'AWS::EC2::Instance', region_name)
        end
      end

    when 'AWS::DataPipeline::Pipeline'
      pipelines = Tags.describe_pipelines(datapipeline, resource)
      auto_tags = Tags.extract_auto_tags(pipelines.pipeline_description_list.first, resource['logical_resource_id'])
      Tags.validate_tags(auto_tags, resource['physical_resource_id'], region_name)

    when 'AWS::ElasticLoadBalancing::LoadBalancer'
      elbv1_tags = Tags.describe_elbv1_tags(elbv1, resource)
      auto_tags  = Tags.extract_auto_tags(elbv1_tags.tag_descriptions.first, resource['logical_resource_id'])
      Tags.validate_tags(auto_tags, resource['physical_resource_id'], region_name)

    when 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      elbv2_tags = Tags.describe_elbv2_tags(elbv2, resource)
      auto_tags  = Tags.extract_auto_tags(elbv2_tags.tag_descriptions.first, resource['logical_resource_id'])
      Tags.validate_tags(auto_tags, resource['physical_resource_id'], region_name)

    when 'AWS::RDS::DBInstance'
      rds_tags  = Tags.list_tags_for_rds(rds, resource)
      auto_tags = Tags.extract_auto_tags(rds_tags, resource['physical_resource_id'])
      Tags.validate_tags(auto_tags, resource['physical_resource_id'], region_name)

    when 'AWS::S3::Bucket'
      bucket_tags = Tags.get_bucket_tagging(s3, resource)
      auto_tags   = Tags.extract_auto_tags(bucket_tags, resource['physical_resource_id'])
      Tags.validate_tags(auto_tags, resource['physical_resource_id'], region_name)

    when 'AWS::EMR::Cluster'
      cluster   = Tags.describe_cluster(emr, resource)
      auto_tags = Tags.extract_auto_tags(cluster.cluster, resource['physical_resource_id'])
      Tags.validate_tags(auto_tags, resource['physical_resource_id'], region_name)

    when 'AWS::DynamoDB::Table'
      table_tags = Tags.list_tags_for_dynamodb(dynamodb, resource)
      auto_tags  = Tags.extract_auto_tags(table_tags, resource['physical_resource_id'])
      Tags.validate_tags(auto_tags, resource['physical_resource_id'], region_name)

    when 'AWS::OpsWorks::Stack'
      list_tags = Tags.list_tags_for_opsworks(opsworks, resource)
      list_tags = list_tags.tags.map { |name, value| { 'key' => name, 'value' => value } }
      list_tags = { tags: list_tags }
      tags = OpenStruct.new list_tags
      auto_tags = Tags.extract_auto_tags(tags)
      Tags.validate_tags(auto_tags, resource['physical_resource_id'], region_name)

      # check the instances within the ops works stack
      if $args['--details'] and !skipped_resource_types.include? resource['resource_type']
        puts heading.call("#{resource['logical_resource_id']}-Instances").to_s
      end

      describe_opsworks_instances = Tags.describe_opsworks_instances(opsworks, resource)
      if describe_opsworks_instances.instances.count > 0
        describe_opsworks_instances.instances.each do |instance|
          if instance['ec2_instance_id'].nil?
            puts $error.call("OpsWorks Instance #{instance['instance_id']} is in a #{instance['status']} state..." )
          else
            Tags.process_ec2_resource(ec2, instance['ec2_instance_id'], 'AWS::EC2::Instance', region_name)
          end
        end
      end

    else
      unless skipped_resource_types.include? resource['resource_type']
        $spinner.error($error.call("No Handler Found for #{resource['resource_type']}"))
      end
    end
  end

  if $spinner.spinning?
    $spinner.update(title: "Gathering tags completed for #{region_name}")
    $spinner.success
  end

  Tags.summary(iam, describe_stacks)
end


