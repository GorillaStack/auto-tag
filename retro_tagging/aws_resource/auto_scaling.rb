require "#{__dir__}/default"

module AwsResource
  class AutoScaling < Default

    def aws_region_services_name
      %w[AutoScaling]
    end

    def friendly_service_name
      'AutoScaling Groups'
    end

    def aws_client(region:,credentials:)
      Aws::AutoScaling::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_auto_scaling_groups'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'auto_scaling_groups'
    end

    def aws_response_resource_name
      'auto_scaling_group_name'
    end

    def aws_event_name
      %w[CreateAutoScalingGroup]
    end

    def resource_name_exists?(**args)
      (args[:request_parameters] && args[:request_parameters]['autoScalingGroupName'])
    end

    def resource_name(**args)
      args[:request_parameters]['autoScalingGroupName']
    end

  end

end
