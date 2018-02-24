require "#{__dir__}/default"

module AwsResource
  class Ec2Snapshot < Default

    def aws_region_services_name
      %w[EC2]
    end

    def friendly_service_name
      'EC2 Snapshots'
    end

    def aws_client(region:,credentials:)
      Aws::EC2::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_snapshots'
    end

    def aws_client_method_args
      {owner_ids: %w[self]}
    end

    def aws_response_collection
      'snapshots'
    end

    def aws_response_resource_name
      'snapshot_id'
    end

    def aws_event_name
      %w[CreateSnapshot]
    end

    def resource_name_exists?(**args)
      (args[:response_elements]['snapshotId'])
    end

    def resource_name(**args)
      args[:response_elements]['snapshotId']
    end

  end

end
