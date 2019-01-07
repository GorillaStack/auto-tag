require "#{__dir__}/default"

module AwsResource
  class ElasticLoadBalancing < Default

    def aws_region_services_name
      %w(ElasticLoadBalancing ElasticLoadBalancingV2)
    end

    def friendly_service_name
      'Elastic Load Balancing'
    end

    def aws_client(region:,credentials:)
      Aws::ElasticLoadBalancing::Client.new(region: region, credentials: credentials)
    end

    def aws_client_method
      'describe_load_balancers'
    end

    def aws_client_method_args
      {}
    end

    def aws_response_collection
      'load_balancer_descriptions'
    end

    def aws_response_resource_name
      'load_balancer_name'
    end

    def aws_event_name
      %w[CreateLoadBalancer]
    end

    def resource_name_exists?(**args)
      if elb_v2?(args)
        (args[:response_elements]['loadBalancers'] &&
            args[:response_elements]['loadBalancers'][0] &&
            args[:response_elements]['loadBalancers'][0]['loadBalancerArn'])
      else
        (args[:request_parameters]['loadBalancerName'])
      end
    end

    def resource_name(**args)
      if elb_v2?(args)
        args[:response_elements]['loadBalancers'][0]['loadBalancerArn']
      else
        args[:request_parameters]['loadBalancerName']
      end
    end

    def elb_v2?(**args)
      (args[:response_elements]['loadBalancers'] &&
          args[:response_elements]['loadBalancers'][0]['loadBalancerArn'])
    end

    def get_existing_resources
      super

      friendly_service_name = 'Elastic Load Balancing v2'
      existing_resources_file = "#{@cache_dir}/#{'Elastic Load Balancing'.gsub(/\s+/,'_',).downcase}_existing.json"

      if @files_cached
        safe_puts "The cache file will be appended for Elastic Load Balancing v2..."

        regions = Aws.partition('aws').regions.
            select { |region| region.services.any? { |r| aws_region_services_name.include? r } }
        regions.each do |region|
          safe_puts "Collecting #{friendly_service_name} from: #{region.name}"
          client = Aws::ElasticLoadBalancingV2::Client.new(region: region.name, credentials: credentials)

          # add next token code
          client.send(aws_client_method, **aws_client_method_args).send('load_balancers').each do |resource|
            @existing_resources[resource.send_chain('load_balancer_arn'.split('.'))] = region.name
          end
        end

        File.open(existing_resources_file,'w') do |f|
          f.write(@existing_resources.to_json)
        end
      end

      safe_puts "Total #{friendly_service_name}: #{@existing_resources.select { |resource| resource.start_with? 'arn'}.count}"

    end
  end

end
