require './aws_resource/default'

module AwsResource
  class Vpc < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'VPCs'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_vpcs'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'vpcs'
    end

    def aws_response_resource_name
      'vpc_id'
    end

    def aws_event_name
      %w[CreateVpc]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['vpc'] &&
          args[:response_elements]['vpc']['vpcId'])
    end

    def resource_name(**args)
      args[:response_elements]['vpc']['vpcId']
    end

  end

end
