require './aws_resource/default'

module AwsResource
  class VpcNatGateway < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'VPC NAT Gateways'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_nat_gateways'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'nat_gateways'
    end

    def aws_response_resource_name
      'nat_gateway_id'
    end

    def aws_event_name
      %w[CreateNatGateway]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['CreateNatGatewayResponse'] &&
          args[:response_elements]['CreateNatGatewayResponse']['natGateway'] &&
          args[:response_elements]['CreateNatGatewayResponse']['natGateway']['natGatewayId'])
    end

    def resource_name(**args)
      args[:response_elements]['CreateNatGatewayResponse']['natGateway']['natGatewayId']
    end

  end

end
