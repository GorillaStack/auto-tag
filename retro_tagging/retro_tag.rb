#!/usr/bin/env ruby

require 'aws-sdk'
require 'json'
require 'pp'
require 'tty-spinner'
require 'filesize'

require './aws_resource/auto_scaling'
require './aws_resource/data_pipeline'
require './aws_resource/dynamo_db_table'
require './aws_resource/ec2_ami'
require './aws_resource/ec2_instance'
require './aws_resource/ec2_snapshot'
require './aws_resource/ec2_volume'
require './aws_resource/eip'
require './aws_resource/elastic_load_balancing'
require './aws_resource/elastic_map_reduce'
require './aws_resource/ops_works'
require './aws_resource/rds'
require './aws_resource/s3_bucket'
require './aws_resource/security_group'
require './aws_resource/vpc'
require './aws_resource/vpc_eni'
require './aws_resource/vpc_internet_gateway'
require './aws_resource/vpc_nat_gateway'
require './aws_resource/vpc_network_acl'
require './aws_resource/vpc_peering'
require './aws_resource/vpc_route_table'
require './aws_resource/vpc_subnet'
require './aws_resource/vpn'


csv_file_folder = '/Users/rjanoka/OneDrivePGi/Projects/AutoTag/retro_tagging'
bucket_name     = 'pgi-cloudtrail'
bucket_region   = 'us-east-1'
lambda_profile  = 'ssoe-sysops'
lambda_region   = 'us-east-1'
scan_profile    = 'development-sysops'
csv_file        = 'all_Development_02052018.csv'

csv_path        = "#{csv_file_folder}/#{csv_file}"

import_start = Time.now
print "Importing from #{csv_path} (#{Filesize.from("#{File.size(csv_path)} B").pretty})..."
csv_text = File.read(csv_path)
csv = CSV.parse(csv_text, :headers => true)
puts "completed in #{Humanize::time(Time.now - import_start)}."

scan_credentials   = Aws::SharedCredentials.new(profile_name: scan_profile)
lambda_credentials = Aws::SharedCredentials.new(profile_name: lambda_profile)

lambda  = Aws::Lambda::Client.new(region: lambda_region, credentials: lambda_credentials, http_read_timeout: 320)

spinner = TTY::Spinner.new(':spinner :title', format: :bouncing_ball)

object_args = {
    csv: csv,
    credentials: scan_credentials,
    bucket_name: bucket_name
}

services = [
    AwsResource::AutoScaling.new(**object_args),
    AwsResource::DataPipeline.new(**object_args),
    AwsResource::DynamoDbTable.new(**object_args),
    AwsResource::Ec2Ami.new(**object_args),
    AwsResource::EC2Instance.new(**object_args),
    AwsResource::Ec2Snapshot.new(**object_args),
    AwsResource::Ec2Volume.new(**object_args),
    AwsResource::Eip.new(**object_args),
    AwsResource::ElasticLoadBalancing.new(**object_args),
    AwsResource::ElasticMapReduce.new(**object_args),
    AwsResource::OpsWorks.new(**object_args),
    AwsResource::Rds.new(**object_args),
    AwsResource::S3Bucket.new(**object_args),
    AwsResource::SecurityGroup.new(**object_args),
    AwsResource::Vpc.new(**object_args),
    AwsResource::VpcEni.new(**object_args),
    AwsResource::VpcInternetGateway.new(**object_args),
    AwsResource::VpcNatGateway.new(**object_args),
    AwsResource::VpcNetworkAcl.new(**object_args),
    AwsResource::VpcPeering.new(**object_args),
    AwsResource::VpcRouteTable.new(**object_args),
    AwsResource::VpcSubnet.new(**object_args),
    AwsResource::Vpn.new(**object_args)
]

services.each { |service| service.get_existing_resources }

processed_count = 0
csv_count       = csv.count
puts "Found #{Humanize::int(csv_count)} total events to process, looking for events with existing resources..."
spinner.update(title: "#{Humanize::int(csv_count)} events selected to be processed...")

aws_scan_start = Time.now
csv.each do |event|
  # next unless event['eventName'] == 'CreateDBInstance'
  event_name = event['eventName'].to_s
  service    = services.find { |service| service.aws_event_name.include? event_name }

  raise "Can't process #{event_name}" if service.nil?

  spinner.spin

  processed = service.process_cloudtrail_event(event: event)

  processed_count += 1 if processed
  csv_count -= 1

  spinner.update(title: "#{Humanize::int(csv_count)} events to scan, #{Humanize::int(processed_count)} events selected to be processed...")
end

spinner.success
puts "Completed event scan in #{Humanize::time(Time.now - aws_scan_start)}"

services.each { |service| puts "#{service.friendly_service_name} #{service.aws_event_name} #{service.existing_resources.count}" }

# combine all of the s3_keys from all services and uniq
# that list to provide the least amount of executions
all_cloudtrail_s3_keys = []

services.each do |service|
  all_cloudtrail_s3_keys.concat(service.cloudtrail_s3_keys.uniq)
end

puts "CloudTrail Keys before uniq: #{all_cloudtrail_s3_keys.count}"
all_cloudtrail_s3_keys.uniq!
puts "CloudTrail Keys after uniq: #{all_cloudtrail_s3_keys.count}"


lambda_start = Time.now
mutex        = Mutex.new
threads      = []
thread_count = 5

if all_cloudtrail_s3_keys.count > 0
  spinner.start
  spinner.update(title: "#{Humanize::int(all_cloudtrail_s3_keys.count)} s3 objects to be processed by the lambda function...")

  thread_count.times do |i|
    threads[i] = Thread.new {
      until all_cloudtrail_s3_keys.count.zero?
        mutex.synchronize do
          spinner.spin
        end
        s3_key = all_cloudtrail_s3_keys.pop
        next unless s3_key

        next unless all_cloudtrail_s3_keys.count < 1_035 #### TEMP #####

        event = AwsResource::Default.s3_object_event(bucket_name, bucket_region, s3_key)

        invocation = lambda.invoke(
                       function_name:   'AutoTag',
                       invocation_type: 'RequestResponse', # or Event
                       payload: JSON.dump(event)
        )

        if invocation.status_code == 200
          spinner.update(title: "#{Humanize::int(all_cloudtrail_s3_keys.count)} s3 objects left to be processed by the lambda function using #{thread_count} threads...")
        else
          spinner.error "Failed processing '#{s3_key}'"
          safe_puts "Error:\n #{pp invocation}"
        end
      end
    }
  end

  threads.each(&:join)

  spinner.success"completed in #{Humanize::time(Time.now - lambda_start)}"

else
  puts 'There were no CloudTrail s3 objects found to process'
end










