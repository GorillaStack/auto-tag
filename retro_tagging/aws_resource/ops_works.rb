require './aws_resource/default'

module AwsResource
  class OpsWorks < Default

    def aws_region_services_name
      %w[OpsWorks]
    end

    def friendly_service_name
      'OpsWorks Stacks'
    end

    def aws_client(region:,credentials:)
      Aws::OpsWorks::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_stacks'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'stacks'
    end

    def aws_response_resource_name
      'name'
    end

    def aws_event_name
      %w[CreateStack CloneStack]
    end

    def resource_name_exists?(**args)
      (args[:request_parameters]['name'])
    end

    def resource_name(**args)
      args[:request_parameters]['name']
    end

  end

end
