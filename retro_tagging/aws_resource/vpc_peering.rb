require "#{__dir__}/default"

module AwsResource
  class VpcPeering < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'VPC Peering Connections'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_vpc_peering_connections'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'vpc_peering_connections'
    end

    def aws_response_resource_name
      'vpc_peering_connection_id'
    end

    def aws_event_name
      %w[CreateVpcPeeringConnection]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['vpcPeeringConnection'] &&
          args[:response_elements]['vpcPeeringConnection']['vpcPeeringConnectionId'])
    end

    def resource_name(**args)
      args[:response_elements]['vpcPeeringConnection']['vpcPeeringConnectionId']
    end

  end

end
