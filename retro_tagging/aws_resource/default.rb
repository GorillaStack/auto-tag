require 'aws-sdk'
require 'json'
require 'csv'

module AwsResource
  class Default

    attr_accessor :resource, :csv, :credentials, :cloudtrail_s3_keys, :files_cached, :existing_resources, :bucket_name, :bucket_region

    def initialize(csv:, credentials:, bucket_name:)
      @csv           = csv
      @credentials   = credentials
      @bucket_name   = bucket_name
      @bucket_region = bucket_region
      @files_cached  = false
      @existing_resources = {}
      @cloudtrail_s3_keys = []
    end

    def get_existing_resources
      @cache_dir = './cache'
      Dir.mkdir(@cache_dir) unless Dir.exist?(@cache_dir)
      existing_resources_file = "#{@cache_dir}/#{friendly_service_name.gsub(/\s+/, '_',).downcase}_existing.json"

      if File.exists? existing_resources_file
        file_mtime_diff = Time.now - File.mtime(existing_resources_file)
      end

      if !file_mtime_diff or file_mtime_diff > 7200 # 2 hours
        safe_puts "The cache file is too old, building a new cache file..."
        @files_cached = true

        regions = Aws.partition('aws').regions.
            select {|region| region.services.any? {|r| aws_region_services_name.include? r}}

        regions.each do |region|
          safe_puts "Collecting #{friendly_service_name} from: #{region.name}"
          client = aws_client(region: region.name, credentials: credentials)

          describe = client.send(aws_client_method, **aws_client_method_args)

          describe.send(aws_response_collection).each do |resource|
            @existing_resources[resource.send_chain(aws_response_resource_name.split('.'))] = region.name
          end

          until describe.last_page?
            describe = describe.next_page
            describe.send(aws_response_collection).each do |resource|
              @existing_resources[resource.send_chain(aws_response_resource_name.split('.'))] = region.name
            end
          end

        end

        File.open(existing_resources_file, 'w') do |f|
          f.write(existing_resources.to_json)
        end
      else
        safe_puts "The cache file is #{Humanize.time(file_mtime_diff)} old, using it..."
        existing_resources_json = File.read(existing_resources_file)
        @existing_resources = JSON.parse(existing_resources_json)
      end

      if friendly_service_name == 'Elastic Load Balancing'
        existing_resources_count = existing_resources.reject {|resource| resource.start_with? 'arn'}.count
      else
        existing_resources_count = existing_resources.count
      end
      safe_puts "Total #{friendly_service_name}: #{Humanize.int(existing_resources_count)}"
    end

    def process_cloudtrail_event(event:)
      event_name = event['eventName']
      s3_path    = event['key']
      response_elements  = JSON.parse(event['responseElements'])
      response_elements  = response_elements.nil? ? {} : response_elements
      request_parameters = JSON.parse(event['requestParameters'])
      request_parameters = request_parameters.nil? ? {} : request_parameters
      options = {
          # event_time:       event['eventtime']
          # event_source:     event['eventsource']
          event_name:         event_name,
          s3_path:            s3_path,
          aws_region:         event['awsRegion'],
          response_elements:  response_elements,
          request_parameters: request_parameters
      }
      if event['recipientAccountId']
        options[:aws_account_id] = event['recipientAccountId']
      else
        options[:aws_account_id] = event['userIdentity.accountId']
      end
      if aws_event_name.include? event_name
        if resource_name_exists?(options)
          event_resource_name = resource_name(options)
        else
          event_resource_name = true
        end

        if existing_resources.has_key? event_resource_name
          @cloudtrail_s3_keys << s3_path.sub("s3://#{bucket_name}/", '')
          return true
        end
      end

      false
    end

    def self.s3_object_event(bucket, region, key)
      { Records: [{
         eventVersion: '2.0',
         eventSource: 'aws:s3',
         awsRegion: region,
         eventName: 'ObjectCreated:Put',
         s3: {
           s3SchemaVersion: '1.0',
           bucket: {
             name: bucket
           },
           object: {
             key: key
           }
         }
        }]
      }
    end
  end
end

class Object
  def send_chain(methods)
    methods.inject(self) do |obj, method|
      obj.send method
    end
  end

  def safe_puts(msg)
    puts msg + "\n"
  end
end

class Humanize
  def self.int(int)
    if decimals(int).zero?
      int.to_s.gsub(/(\d)(?=(\d\d\d)+(?!\d))/, '\1,')
    else
      int.round(1).to_s.gsub(/(\d)(?=(\d\d\d)+(?!\d))/, '\1,')
    end
  end

  def self.decimals(a)
    num = 0
    while(a != a.to_i)
      num += 1
      a *= 10
    end
    num
  end

  def self.time(secs)
    [[60, :seconds], [60, :minutes], [24, :hours], [1000, :days]].map do |count, name|
      if secs > 0
        secs, n = secs.divmod(count)
        "#{n.to_i} #{name}"
      end
    end.compact.reverse.join(' ')
  end
end
