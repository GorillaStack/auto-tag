require "#{__dir__}/default"

module AwsResource
  class EC2Instance < Default

    def aws_region_services_name
      'EC2'
    end

    def friendly_service_name
      'EC2 Instances'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_instance_status'
    end

    def aws_client_method_args
      {include_all_instances: true}
    end

    def aws_response_collection
      'instance_statuses'
    end

    def aws_response_resource_name
      'instance_id'
    end

    def aws_event_name
      %w[RunInstances]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['instancesSet'] &&
          args[:response_elements]['instancesSet']['items'] &&
          args[:response_elements]['instancesSet']['items'][0]['instanceId'])
    end

    def resource_name(**args)
      args[:response_elements]['instancesSet']['items'][0]['instanceId']
    end

  end

end
