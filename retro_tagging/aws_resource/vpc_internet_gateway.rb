require './aws_resource/default'

module AwsResource
  class VpcInternetGateway < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'VPC Internet Gateways'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_internet_gateways'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'internet_gateways'
    end

    def aws_response_resource_name
      'internet_gateway_id'
    end

    def aws_event_name
      %w[CreateInternetGateway]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['internetGateway'] && args[:response_elements]['internetGateway']['internetGatewayId'])
    end

    def resource_name(**args)
      args[:response_elements]['internetGateway']['internetGatewayId']
    end

  end

end
