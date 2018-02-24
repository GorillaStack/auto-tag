require "#{__dir__}/default"

module AwsResource
  class ElasticMapReduce < Default

    def aws_region_services_name
      %w[EMR]
    end

    def friendly_service_name
      'EMR Clusters'
    end

    def aws_client(region:,credentials:)
      Aws::EMR::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'list_clusters'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'clusters'
    end

    def aws_response_resource_name
      'id'
    end

    def aws_event_name
      %w[RunJobFlow]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['jobFlowId'])
    end

    def resource_name(**args)
      args[:response_elements]['jobFlowId']
    end

  end

end
