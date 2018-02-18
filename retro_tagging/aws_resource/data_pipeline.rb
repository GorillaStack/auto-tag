require './aws_resource/default'

module AwsResource
  class DataPipeline < Default

    def aws_region_services_name
      %w[DataPipeline]
    end

    def friendly_service_name
      'Data Pipelines'
    end

    def aws_client(region:,credentials:)
      Aws::DataPipeline::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'list_pipelines'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'pipeline_id_list'
    end

    def aws_response_resource_name
      'id'
    end

    def aws_event_name
      %w[CreatePipeline]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['pipelineId'])
    end

    def resource_name(**args)
      args[:response_elements]['pipelineId']
    end

  end

end
