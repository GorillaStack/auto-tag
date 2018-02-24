require "#{__dir__}/default"

module AwsResource
  class Eip < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'EC2 EIPs'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_addresses'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'addresses'
    end

    def aws_response_resource_name
      'allocation_id'
    end

    def aws_event_name
      %w[AllocateAddress]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['allocationId'])
    end

    def resource_name(**args)
      args[:response_elements]['allocationId']
    end

  end

end
