require './aws_resource/default'

module AwsResource
  class Ec2Volume < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'EC2 Volumes'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_volumes'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'volumes'
    end

    def aws_response_resource_name
      'volume_id'
    end

    def aws_event_name
      %w[CreateVolume]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['volumeId'])
    end

    def resource_name(**args)
      args[:response_elements]['volumeId']
    end

  end

end
