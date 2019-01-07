require "#{__dir__}/default"

module AwsResource
  class VpcEni < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'VPC ENIs'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_network_interfaces'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'network_interfaces'
    end

    def aws_response_resource_name
      'network_interface_id'
    end

    def aws_event_name
      %w[CreateNetworkInterface]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['networkInterface'] &&
          args[:response_elements]['networkInterface']['networkInterfaceId'])
    end

    def resource_name(**args)
      args[:response_elements]['networkInterface']['networkInterfaceId']
    end

  end

end
