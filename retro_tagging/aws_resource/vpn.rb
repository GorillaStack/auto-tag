require "#{__dir__}/default"

module AwsResource
  class Vpn < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'VPNs'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_vpn_connections'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'vpn_connections'
    end

    def aws_response_resource_name
      'vpn_connection_id'
    end

    def aws_event_name
      %w[CreateVpnConnection]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['vpnConnection'] &&
          args[:response_elements]['vpnConnection']['vpnConnectionId'])
    end

    def resource_name(**args)
      args[:response_elements]['vpnConnection']['vpnConnectionId']
    end

  end

end
