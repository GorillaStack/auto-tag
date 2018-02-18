require './aws_resource/default'

module AwsResource
  class S3Bucket < Default

    def aws_region_services_name
      %w[S3]
    end

    def friendly_service_name
      'S3 Buckets'
    end

    def aws_client(region:,credentials:)
      Aws::S3::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'list_buckets'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'buckets'
    end

    def aws_response_resource_name
      'name'
    end

    def aws_event_name
      %w[CreateBucket]
    end

    def resource_name_exists?(**args)
      (args[:request_parameters]['bucketName'])
    end

    def resource_name(**args)
      args[:request_parameters]['bucketName']
    end

  end

end
