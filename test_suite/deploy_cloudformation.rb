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
Create, Destroy, and Rebuild the test resources in CloudFormation stacks for the Auto Tag Test Suite

Usage:
  #{File.basename __FILE__} --action=ACTION [--regions=REGION] [--profile=PROFILE]
                [--stack=STACK_NAME]
  #{File.basename __FILE__} -h | --help

Options:
  -h --help                   Show this screen.
  --action=ACTION             The CloudFormation action to take either create or delete, defaults to create.
  --regions=REGIONS           The AWS Regions (comma delimited) to apply changes to, defaults to us-east-1.
  --profile=PROFILE           The AWS credential profile.
  --stack=STACK_NAME          The CloudFormation stack name, defaults to "AutoTag-Test".

DOCOPT

begin
  $args = Docopt::docopt(doc)
rescue Docopt::Exit => e
  puts e.message
end


aws_regions     = $args['--regions'] ? $args['--regions'] : 'us-east-1'
aws_profile     = $args['--profile'] ? $args['--profile'] : 'default'
stack_name      = $args['--stack']   ? $args['--stack']   : 'AutoTag-Test'
action          = $args['--action']  ? $args['--action']  : 'create'

credentials = Aws::SharedCredentials.new(profile_name: aws_profile)
regions     = aws_regions.split(/[,\s]+/)
cf_directory = 'test_suite-cloud_formation'
cf_template  = 'autotag_event_test-template'

puts 'Generating a fresh template JSON file from the template ruby DSL...'

if action == 'create'
  if ::File.exist? "#{cf_directory}/#{cf_template}.rb"
    orig_dir = Dir.pwd
    Dir.chdir(cf_directory)
    output = `./#{cf_template}.rb expand > "#{cf_template}.json"`
    output.split("\n").each do |line|
      puts "Ruby DSL Output: #{line}"
    end
    Dir.chdir orig_dir
  else
    raise "The CloudFormation Ruby DSL is missing: #{cf_template}.rb"
  end
end

regions.each do |region_name|
  $spinner = TTY::Spinner.new(':spinner :title', format: :bouncing_ball)

  aws_regions = Aws.partition('aws').regions
  region_description = aws_regions.select { |r| r.name == region_name }
  region_description = region_description.first.description.sub!(/.*\((.*)\)/, '\1')

  # puts "**** #{title.call("#{region_name} (#{region_description})")} ****"

  cfn = Aws::CloudFormation::Client.new(region: region_name, credentials: credentials)

  case action.downcase
    when 'create'
      begin
        Tags.create_stack(cfn, stack_name)
        puts "#{region_name}: #{stack_name} stack create initiated."
      rescue Aws::CloudFormation::Errors::AlreadyExistsException
        puts "#{region_name}: #{stack_name} stack already exists, skipping..."
        next
      end
    when 'delete'
      begin
        Tags.describe_stacks(cfn, stack_name)
      rescue Aws::CloudFormation::Errors::ValidationError
        puts "#{region_name}: #{stack_name} stack does not exist, skipping..."
        next
      end
      Tags.delete_stack(cfn, stack_name)
      puts "#{region_name}: #{stack_name} stack delete initiated."
    else
      puts 'Un-supported action!'
  end


end


