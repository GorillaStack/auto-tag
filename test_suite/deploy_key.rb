#!/usr/bin/env ruby

require 'aws-sdk'
require 'pp'
require 'docopt'

doc = <<DOCOPT
Import EC2 Key Pairs from disk for the Auto Tag Test Suite

Usage:
  #{__FILE__}
  #{__FILE__} [--details] [--profile=PROFILE] [--region=REGION] 
               [--key-name=KEY_NAME] [--key-file=KEY_FILE]
  #{__FILE__} -h | --help

Options:
  -h --help                Show this screen.
  --profile=PROFILE        The AWS credential profile.
  --region=REGION          The AWS Region to import the keys, defaults to import in all regions.
  --key-name=KEY_NAME      The AWS Key Pair name.
  --key-file=KEY_FILE      The AWS Key Pair file path.

DOCOPT

begin
  $args = Docopt::docopt(doc)
rescue Docopt::Exit => e
  puts e.message
end

aws_profile = $args['--profile']  ? $args['--profile']  : 'default'
aws_region  = $args['--region']   ? $args['--region']   : nil
key_name    = $args['--key-name'] ? $args['--key-name'] : nil
key_file    = $args['--key-file'] ? $args['--key-file'] : nil
credentials = Aws::SharedCredentials.new(profile_name: aws_profile)

# all regions that exist according to the SDK
Aws.partition('aws').regions.each do |region|
  if aws_region.nil?
    puts 'Not specifying the region argument will cause a push to all regions, are you sure? (yes/no)'
    prompt = gets
    exit 1 unless %w[y yes].include? prompt.chomp
  else
    next unless region.name == aws_region
  end

  region_description = region.description.sub(/.*\((.*)\)/, '\1')
  puts "#{region.name} (#{region_description})"

  key = File.open(key_file, 'r')
  client = Aws::EC2::Client.new(region: region.name, credentials: credentials)

  begin
    client.describe_key_pairs(key_names: [key_name])
  rescue Aws::EC2::Errors::InvalidKeyPairNotFound
    import_key_pair = client.import_key_pair(
      dry_run: false,
      key_name: key_name,
      public_key_material: key
    )

    pp import_key_pair
  end

end
