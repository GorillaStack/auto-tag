require './aws_resource/default'

module AwsResource
  class DynamoDbTable < Default

    def aws_region_services_name
      %w[DynamoDB]
    end

    def friendly_service_name
      'DynamoDB Tables'
    end

    def aws_client(region:,credentials:)
      Aws::DynamoDB::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'list_tables'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'table_names'
    end

    def aws_response_resource_name
      ''
    end

    def aws_event_name
      %w[CreateTable]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['tableDescription'] &&
          args[:response_elements]['tableDescription']['tableArn'])
    end

    def resource_name(**args)
      args[:response_elements]['tableDescription']['tableArn'].sub(/.*table\/(.*)$/, '\1')
    end

  end

end
