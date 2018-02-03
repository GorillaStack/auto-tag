#!/usr/bin/env ruby

require 'aws-sdk'
require 'pp'

class Params
  def self.put_param(ssm, name, value, type = 'String')
    begin
      put_parameter = ssm.put_parameter(
        name: name,
        description: '',
        value: value,
        type: type,
        overwrite: true
      )
    rescue Aws::SSM::Errors::ParameterAlreadyExists
    end
    puts "#{name} = #{value} (#{put_parameter})" if put_parameter
  end

  def self.describe_ami(ec2)
    ec2.describe_images(
      executable_users: ['all'],
      filters: [
        {
          name: 'name',
          values: ['amzn-ami-hvm-????.??.?.*-x86_64-gp2']
        },
        {
          name: 'state',
          values: ['available']
        }
      ],
      owners: ['amazon'],
      dry_run: false
    )
  end
end


require 'docopt'
doc = <<DOCOPT
Put the SSM parameters for the Auto Tag Test Suite

Usage:
  #{__FILE__} --key-name=KEY_NAME [--profile=PROFILE] 
               [--region=REGION] [--cidr=START_CIDR]
  #{__FILE__} -h | --help

Options:
  -h --help                Show this screen.
  --profile=PROFILE        The AWS credential profile, default is 'default'.
  --region=REGION          The AWS Region to add the SSM parameters to, defaults to add unique params in all regions.
  --key-name=KEY_NAME      The AWS Key Pair name, required.
  --cidr=START_CIDR        The first two octets of a private Class B CIDR that we can use for the testing, the default is "192.168".

DOCOPT


begin
  $args = Docopt::docopt(doc)
rescue Docopt::Exit => e
  puts e.message
end

aws_profile   = $args['--profile']  ? $args['--profile']  : 'default'
aws_region    = $args['--region']   ? $args['--region']   : nil
key_name      = $args['--key-name'] ? $args['--key-name'] : nil
starting_cidr = $args['--cidr']     ? $args['--cidr']     : '192.168'
credentials   = Aws::SharedCredentials.new(profile_name: aws_profile)

# all regions that exist according to the SDK
Aws.partition('aws').regions.each_with_index do |region, index|
  if aws_region.nil? && index == 0
    puts 'Not specifying the region argument will cause a push to all regions, are you sure? (yes/no)'
    prompt = STDIN.gets.chomp
    exit 1 unless %w[y yes].include? prompt
    puts 'Starting deployment of SSM parameters...'
  elsif aws_region
    next unless region.name == aws_region
  end

  region_description = region.description.sub(/.*\((.*)\)/, '\1')
  short_region_desc  = region.description.sub(/.*\((.*)\)/, '\1').gsub(/[\.\s]+/, '')
  cidr_index  = 100 + index
  vpc_cidr    = "#{starting_cidr}.#{cidr_index}.0/24"
  subnet_cidrs = "#{starting_cidr}.#{cidr_index}.0/26, #{starting_cidr}.#{cidr_index}.64/26, #{starting_cidr}.#{cidr_index}.128/26"

  # a 2nd VPC for testing VPC Peering Connections
  peering_cidr_index  = 200 + index
  peering_vpc_cidr    = "#{starting_cidr}.#{peering_cidr_index}.0/24"

  ec2 = Aws::EC2::Client.new(region: region.name, credentials: credentials)

  describe_images = Params.describe_ami(ec2)
  latest_ami = describe_images.images.last

  puts "#{region.name} (#{region_description})"

  ssm = Aws::SSM::Client.new(region: region.name, credentials: credentials)

  Params.put_param(ssm, '/AutoTagTest/KeyName', key_name)
  Params.put_param(ssm, '/AutoTagTest/AmiImageId', latest_ami.image_id)
  Params.put_param(ssm, '/AutoTagTest/VpcCidrBlock', vpc_cidr)
  Params.put_param(ssm, '/AutoTagTest/SubnetCidrBlocks', subnet_cidrs, 'StringList')
  Params.put_param(ssm, '/AutoTagTest/VpcCidrBlockForVpcPeering', peering_vpc_cidr)
  Params.put_param(ssm, '/AutoTagTest/OpsWorksStackName', "AutoTagTestOpsWorksStack#{short_region_desc}")
end
