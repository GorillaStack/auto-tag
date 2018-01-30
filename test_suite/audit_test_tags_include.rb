class Tags

  ### EC2 ###

  def self.describe_ec2_tags(ec2, resource_ids)
    ec2.describe_tags(
      filters: [{
        name: 'resource-id',
        values: resource_ids
      }]
    )
  end

  def self.process_ec2_resource(ec2, resource_id, resource_type)
    resource_ids = [resource_id]

    if resource_type == 'AWS::EC2::Instance'
      Tags.process_ec2_instance(ec2, resource_id, resource_ids)
    elsif resource_type == 'AWS::EC2::EIP'
      Tags.process_ec2_eip(ec2, resource_id, resource_ids)
    end

    tags      = Tags.describe_ec2_tags(ec2, resource_ids)
    auto_tags = Tags.extract_auto_tags(tags)

    validate_tags(auto_tags, resource_id)
  end

  def self.describe_instance(ec2, resource_id)
    ec2.describe_instances(instance_ids: [resource_id])
  end

  def self.process_ec2_instance(ec2, resource_id, resource_ids)
    describe_instance = Tags.describe_instance(ec2, resource_id)

    block_devices      = describe_instance.reservations.first['instances'].first['block_device_mappings']
    network_interfaces = describe_instance.reservations.first['instances'].first['network_interfaces']

    block_devices.each do |block_device|
      resource_ids.push block_device['ebs']['volume_id']
    end

    network_interfaces.each do |network_interface|
      resource_ids.push network_interface['network_interface_id']
    end
  end

  def self.describe_addresses(ec2, resource_id)
    ec2.describe_addresses(filters: [{ name: 'public-ip', values: [resource_id] }])
  end

  def self.process_ec2_eip(ec2, resource_id, resource_ids)
    addresses = Tags.describe_addresses(ec2, resource_id)
    allocation_id = addresses.addresses.first['allocation_id']
    # replace the physical-id (the IP) with the eip-alloc ID
    resource_ids.delete resource_id
    resource_ids.push allocation_id
  end


  ### Auto-Scaling ###

  def self.describe_auto_scaling_groups(autoscaling, resource)
    autoscaling.describe_auto_scaling_groups(auto_scaling_group_names: [
        resource['physical_resource_id']
    ])
  end

  def self.describe_autoscaling_tags(autoscaling, resource)
    autoscaling.describe_tags(
        filters: [{
                      name:   'auto-scaling-group',
                      values: [resource['physical_resource_id']]
                  }]
    )
  end


  ### ELB ###

  def self.describe_elbv1_tags(elbv1, resource)
    elbv1.describe_tags(load_balancer_names: [
        resource['physical_resource_id']
    ])
  end

  def self.describe_elbv2_tags(elbv2, resource)
    elbv2.describe_tags(resource_arns: [
        resource['physical_resource_id']
    ])
  end


  ### MISC ###

  def self.list_tags_for_rds(rds, resource)
    db_instance = rds.describe_db_instances(db_instance_identifier: resource['physical_resource_id'])
    rds.list_tags_for_resource(resource_name: db_instance.db_instances.first['db_instance_arn'])
  end

  def self.get_bucket_tagging(s3, resource)
    s3.get_bucket_tagging(bucket: resource['physical_resource_id'])
  end

  def self.describe_cluster(emr, resource)
    emr.describe_cluster(cluster_id: resource['physical_resource_id'])
  end

  def self.describe_pipelines(datapipeline, resource)
    datapipeline.describe_pipelines(pipeline_ids: [
        resource['physical_resource_id']
    ])
  end

  def self.list_tags_for_dynamodb(dynamodb, resource)
    dynamodb_table = dynamodb.describe_table(table_name: resource['physical_resource_id'])
    dynamodb.list_tags_of_resource(resource_arn: dynamodb_table.table['table_arn'])
  end

  def self.list_tags_for_opsworks(opsworks, resource)
    stack = opsworks.describe_stacks(stack_ids: [resource['physical_resource_id']])
    opsworks.list_tags(resource_arn: stack.stacks.first['arn'])
  end

  def self.describe_opsworks_instances(opsworks, resource)
    opsworks.describe_instances(stack_id: resource['physical_resource_id'])
  end

  ### GENERAL ###

  def self.describe_stack_resources(cfn, stack_name)
    cfn.describe_stack_resources(stack_name: stack_name)
  end

  def self.describe_stacks(cfn, stack_name)
    cfn.describe_stacks(stack_name: stack_name)
  end

  def self.extract_auto_tags(tags, resource_id = nil)
    $spinner.spin unless $args['--details']
    auto_tag_prefix = 'AutoTag_'
    auto_tags_view  = []

    if tags.respond_to? :tags
      auto_tags = tags.tags.select     { |tag| tag['key'].include? auto_tag_prefix }
    elsif tags.respond_to? :tag_list # rds
      auto_tags = tags.tag_list.select { |tag| tag['key'].include? auto_tag_prefix }
    elsif tags.respond_to? :tag_set # s3 bucket
      auto_tags = tags.tag_set.select  { |tag| tag['key'].include? auto_tag_prefix }
    else
      raise 'Not sure how to extract these tags...'
    end

    auto_tags.each do |auto_tag|
      if auto_tag.to_h.has_key? :resource_id
        resource = auto_tag['resource_id']
      else
        resource = resource_id
      end

      auto_tags_view.push ({
          resource: resource,
          key:      auto_tag['key'],
          value:    auto_tag['value'],
      })
    end

    auto_tags_view
  end

  def self.validate_tags(auto_tags, resource_id)
    $spinner.spin unless $args['--details']
    if $args['--details']
      if auto_tags.count.zero?
        puts $error.call("No AutoTags Found for #{resource_id}")
      else
        puts auto_tags.sort_by{ |tag| [tag[:resource], tag[:key]] }
      end
    end

    if auto_tags.count.zero?
      $results_bad << "No AutoTags Found for #{resource_id}"
    else
      $results_good << auto_tags.sort_by{ |tag| [tag[:resource], tag[:key]] }
    end
  end

  def self.summary(iam, describe_stacks)
    if $args['--user-arn']
      user = $args['--user-arn']
    else
      user = iam.get_user
      # special processing for me, heh
      if tag[:key].include? 'user/cgw-'
        user = user.user['arn'].split('-')[0...-1].join('-')
      else
        user = user.user['arn']
      end
    end


    stack_creation_time = describe_stacks.stacks.first['creation_time']
    invoked_by_services = %w[cloudformation autoscaling opsworks]
    failed_checks = []

    pastel = Pastel.new
    good   = pastel.green.detach
    bad    = pastel.red.detach

    results_good_sum = 0
    results_bad_sum  = 0

    $results_good.each do |tags|
      tags.each do |tag|
        #
        if tag[:key] == 'AutoTag_Creator'
          # special processing for me, heh
          if tag[:key].include? 'user/cgw-'
            creator = tag[:value].split('-')[0...-1].join('-')
          else
            creator = tag[:value]
          end
          if creator == user
            results_good_sum += 1
          else
            failed_checks << tag
            results_bad_sum  += 1
          end
        elsif tag[:key] == 'AutoTag_CreateTime'
          tag_create_time = Time.parse tag[:value]
          if tag_create_time >= stack_creation_time and tag_create_time <= Time.now.utc
            results_good_sum += 1
          else
            failed_checks << tag
            results_bad_sum  += 1
          end
        elsif tag[:key] == 'AutoTag_InvokedBy' and invoked_by_services.any? { |s| tag[:value].include? s }
          results_good_sum += 1
        else
          failed_checks << tag
          results_bad_sum  += 1
        end
      end
    end

    $results_bad.each  { |result| results_bad_sum  += 1 }

    puts
    puts "Results: #{good.call(results_good_sum)} Passed Checks and #{bad.call(results_bad_sum)} Failed Checks"

    puts
    puts "CloudFormation Stack Status: [#{describe_stacks.stacks.first['stack_status']}]"

    puts $error.call("\nFailed Checks:") if failed_checks.count > 0 or $results_bad.count > 0
    puts failed_checks if failed_checks.count > 0
    puts $results_bad  if $results_bad.count  > 0

  end
end


