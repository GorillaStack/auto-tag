require "#{__dir__}/default"

module AwsResource
  class Rds < Default

    def aws_region_services_name
      %w[RDS]
    end

    def friendly_service_name
      'RDS Instances'
    end

    def aws_client(region:,credentials:)
      Aws::RDS::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_db_instances'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'db_instances'
    end

    def aws_response_resource_name
      'db_instance_arn'
    end

    def aws_event_name
      %w[CreateDBInstance]
    end

    def resource_name_exists?(**args)
      if args[:response_elements]['dBInstanceArn']
        (args[:response_elements]['dBInstanceArn'])
      else
        arn_builder(args)
      end
    end

    def resource_name(**args)
      if args[:response_elements]['dBInstanceArn']
        args[:response_elements]['dBInstanceArn']
      else
        arn_builder(args)
      end
    end

    def arn_builder(**args)
      arn_builder = %w(arn aws rds)
      arn_builder.push args[:aws_region]
      arn_builder.push args[:aws_account_id]
      arn_builder.push 'db'
      arn_builder.push args[:request_parameters]['dBInstanceIdentifier']
      arn_builder.join(':')
    end
  end
end
