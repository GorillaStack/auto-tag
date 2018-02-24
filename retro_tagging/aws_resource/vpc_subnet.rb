require "#{__dir__}/default"

module AwsResource
  class VpcSubnet < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'VPC Subnets'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_subnets'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'subnets'
    end

    def aws_response_resource_name
      'subnet_id'
    end

    def aws_event_name
      %w[CreateSubnet]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['subnet'] && args[:response_elements]['subnet']['subnetId'])
    end

    def resource_name(**args)
      args[:response_elements]['subnet']['subnetId']
    end

  end

end
