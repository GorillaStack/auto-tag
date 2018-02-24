#!/usr/bin/env ruby

require 'aws-sdk'
require 'json'
require 'pp'
require 'tty-spinner'
require 'filesize'
require 'terminal-table'
require 'pastel'

Dir["#{__dir__}/aws_resource/*.rb"].each {|file| require file }

pastel   = Pastel.new
$bold    = pastel.bold.underline.detach
$heading = pastel.blue.bold.detach
$error   = pastel.red.detach
$red     = pastel.red.detach
$yellow  = pastel.yellow.detach
$green   = pastel.green.detach

require 'docopt'
doc = <<DOCOPT
Apply retro-active AutoTags to a single account using an Athena CSV from CloudTrail S3 logs

Usage:
  #{__FILE__} --csv=CSV_FILE --bucket=BUCKET_NAME [--bucket-region=BUCKET_REGION]
                [--lambda=LAMBDA_NAME] [--lambda-profile=LAMBDA_PROFILE] [--lambda-region=LAMBDA_REGION]
                [--threads=THREADS_COUNT] [--scan-profile=SCAN_PROFILE]
                [--scan-access-key-id=ACCESS_KEY_ID] [--scan-secret-access-key=SECRET_ACCESS_KEY]
                [--ignore-cache]
  #{__FILE__} -h | --help

Options:
  -h --help                                   Show this screen.
  --csv=CSV_FILE                              The Athena CloudTrail CSV output file
  --bucket=BUCKET_NAME                        The CloudTrail log S3 bucket
  --bucket-region=BUCKET_REGION               The CloudTrail log S3 bucket region
  --lambda=LAMBDA_NAME                        The name of the Lambda function - defaults to "AutoTagRetro"
  --lambda-profile=LAMBDA_PROFILE             The AWS credential profile to invoke the Lambda function
  --lambda-region=LAMBDA_REGION               The region where the Lambda function is located
  --lambda-threads=LAMBDA_THREADS             The number of concurrent lambda invoke functions to run 
  --scan-profile=SCAN_PROFILE                 The AWS credential profile for the scanner to verify resource existence
  --scan-access-key-id=ACCESS_KEY_ID          The AWS access key ID for the scanner to verify resources existence
  --scan-secret-access-key=SECRET_ACCESS_KEY  The AWS secret access key for the scanner to verify resources existence
  --ignore-cache                              Ignore the cache files and start the discovery process from the beginning.

DOCOPT

begin
  $args = Docopt::docopt(doc)
rescue Docopt::Exit => e
  puts e.message
end

bucket_name     = $args['--bucket']         ? $args['--bucket']        : nil
bucket_region   = $args['--bucket-region']  ? $args['--bucket-region'] : 'us-east-1'
lambda_name     = $args['--lambda']         ? $args['--lambda']         : 'AutoTagRetro'
lambda_region   = $args['--lambda-region']  ? $args['--lambda-region']  : 'us-east-1'
lambda_profile  = $args['--lambda-profile'] ? $args['--lambda-profile'] : 'default'
thread_count    = $args['--lambda_threads'] ? $args['--lambda_threads'] : 3
csv_file        = $args['--csv']            ? $args['--csv']           : nil
scan_profile    = $args['--scan-profile']   ? $args['--scan-profile']  : 'default'
scan_access_key_id     = $args['--scan-access-key-id']     ? $args['--scan-access-key-id']     : nil
scan_secret_access_key = $args['--scan-secret-access-key'] ? $args['--scan-secret-access-key'] : nil

csv_file_folder = "#{File.dirname(csv_file)}"
csv_file        = File.basename(csv_file)

csv_path = File.expand_path "#{csv_file_folder}/#{csv_file}"

import_start = Time.now
print "Importing from #{csv_path} (#{Filesize.from("#{File.size(csv_path)} B").pretty})..."
csv_text = File.read(csv_path)
csv = CSV.parse(csv_text, :headers => true)
puts "completed in #{Humanize.time(Time.now - import_start)}."

if scan_access_key_id and scan_secret_access_key
  scan_credentials = Aws::Credentials.new(scan_access_key_id, scan_secret_access_key)
else
  scan_credentials = Aws::SharedCredentials.new(profile_name: scan_profile)
end

lambda_credentials = Aws::SharedCredentials.new(profile_name: lambda_profile)

lambda  = Aws::Lambda::Client.new(region: lambda_region, credentials: lambda_credentials, http_read_timeout: 320)

spinner = TTY::Spinner.new(':spinner :title', format: :bouncing_ball)

object_args = {
    csv: csv,
    credentials: scan_credentials,
    bucket_name: bucket_name,
    profile: scan_profile
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
puts "Found #{Humanize.int(csv_count)} total events to process, looking for events with existing resources..."
spinner.update(title: "#{Humanize.int(csv_count)} events selected to be processed...")

aws_scan_start = Time.now
csv.each do |event|
  event_name = event['eventName'].to_s
  service    = services.find { |service| service.aws_event_name.include? event_name }

  raise "Can't process #{event_name}" if service.nil?

  spinner.spin

  processed = service.process_cloudtrail_event(event: event)

  processed_count += 1 if processed
  csv_count -= 1

  spinner.update(title: "#{Humanize.int(csv_count)} events to scan, #{Humanize.int(processed_count)} events selected to be processed...")
end

spinner.success
puts "Completed event scan in #{Humanize.time(Time.now - aws_scan_start)}"

# services.each { |service| puts "#{service.friendly_service_name} #{service.aws_event_name} #{service.existing_resources.count}" }

summary_rows = []
services.each_with_index do |service, index|
  summary_rows << %W(#{service.friendly_service_name} #{service.aws_event_name.join(', ')} #{service.existing_resources.count.to_s.rjust(4)})
  summary_rows << :separator unless (services.count - 1) == index
end

puts Terminal::Table.new(
    :title => $bold.call('Retro-Active Tagging for Existing Resources Summary'),
    :headings => %W[#{$heading.call('Service')} #{$heading.call('Event')} #{$heading.call('Count')}],
    :rows => summary_rows
)

# combine all of the s3_keys from all services and uniq
# that list to provide the least amount of executions
# all_cloudtrail_s3_keys = []
all_cloudtrail_s3      = {}

# services.each do |service|
#   all_cloudtrail_s3_keys.concat(service.cloudtrail_s3_keys.uniq)
# end

services.each do |service|
  all_cloudtrail_s3.merge!(service.cloudtrail_s3)
end

##### hack to load 1 service
##### all_cloudtrail_s3 = services.first.cloudtrail_s3.dup

# puts "CloudTrail Keys before uniq: #{all_cloudtrail_s3_keys.count}"
# all_cloudtrail_s3_keys.uniq!
# puts "CloudTrail Keys after uniq: #{all_cloudtrail_s3_keys.count}"

puts "Total CloudTrail Events: #{Humanize.int(all_cloudtrail_s3.count)}"

all_cloudtrail_s3_keys = all_cloudtrail_s3.values
all_cloudtrail_s3_keys.uniq!

puts "Unique CloudTrail S3 Objects: #{Humanize.int(all_cloudtrail_s3_keys.count)}"

lambda_start = Time.now
mutex        = Mutex.new
threads      = []

puts "Starting #{thread_count} Lambda Function threads..."

if all_cloudtrail_s3_keys.count > 0
  spinner.start
  spinner.update(title: "#{Humanize.int(all_cloudtrail_s3_keys.count)} S3 objects to be processed by the #{lambda_name} Lambda Function...")

  thread_count.times do |i|
    threads[i] = Thread.new {
      until all_cloudtrail_s3_keys.count.zero?
        mutex.synchronize do
          spinner.spin
        end
        s3_key = all_cloudtrail_s3_keys.pop
        next unless s3_key

        # next unless all_cloudtrail_s3_keys.count < 1_035 #### TEMP #####

        event = AwsResource::Default.s3_object_event(bucket_name, bucket_region, s3_key)

        invocation = lambda.invoke(
                       function_name:   lambda_name,
                       invocation_type: 'RequestResponse', # or Event
                       payload: JSON.dump(event)
        )

        if invocation.status_code == 200
          spinner.update(title: "#{Humanize.int(all_cloudtrail_s3_keys.count)} S3 objects left to be processed by the #{lambda_name} Lambda Function...")
        else
          spinner.error "Failed processing '#{s3_key}'"
          safe_puts "Error:\n #{pp invocation}"
        end

      end
    }
  end

  threads.each(&:join)

  spinner.success"completed in #{Humanize.time(Time.now - lambda_start)}"

else
  puts 'There were no CloudTrail s3 objects found to process'
end










