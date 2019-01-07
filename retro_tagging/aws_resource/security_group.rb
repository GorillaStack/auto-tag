require "#{__dir__}/default"

module AwsResource
  class SecurityGroup < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'Security Groups'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_security_groups'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'security_groups'
    end

    def aws_response_resource_name
      'group_id'
    end

    def aws_event_name
      %w[CreateSecurityGroup]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['groupId'])
    end

    def resource_name(**args)
      args[:response_elements]['groupId']
    end

  end

end
