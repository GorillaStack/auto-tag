require "#{__dir__}/default"

module AwsResource
  class Ec2Ami < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'EC2 AMI'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_images'
    end

    def aws_client_method_args
      {owners: %w[self]}
    end

    def aws_response_collection
      'images'
    end

    def aws_response_resource_name
      'image_id'
    end

    def aws_event_name
      %w[CreateImage]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['imageId'])
    end

    def resource_name(**args)
      args[:response_elements]['imageId']
    end

  end

end
