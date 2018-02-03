#!/usr/bin/env ruby

require 'bundler/setup'
require 'cloudformation-ruby-dsl/cfntemplate'
# require 'cloudformation-ruby-dsl/spotprice'
# require 'cloudformation-ruby-dsl/table'

template do
  value AWSTemplateFormatVersion: '2010-09-09'

  value Description: 'Auto Tag Test Suite (Open Source by GorillaStack)'

  parameter 'KeyName',
            Description: 'Name of an existing EC2 KeyPair',
            Type: 'AWS::SSM::Parameter::Value<AWS::EC2::KeyPair::KeyName>',
            Default: '/AutoTagTest/KeyName'

  parameter 'AmiImageId',
            Description: 'Name of the AWS AMI Image ID',
            Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>',
            Default: '/AutoTagTest/AmiImageId'

  parameter 'VpcCidrBlock',
            Description: 'VPC CIDR block for the main VPC',
            Type: 'AWS::SSM::Parameter::Value<String>',
            Default: '/AutoTagTest/VpcCidrBlock'

  parameter 'SubnetCidrBlocks',
            Description: 'Code for the Availability Zone to use for the Volume',
            Type: 'AWS::SSM::Parameter::Value<CommaDelimitedList>',
            Default: '/AutoTagTest/SubnetCidrBlocks'

  parameter 'VpcCidrBlockForVpcPeering',
            Description: 'VPC CDIR block that is created to test VPC Peering',
            Type: 'AWS::SSM::Parameter::Value<String>',
            Default: '/AutoTagTest/VpcCidrBlockForVpcPeering'

  parameter 'OpsWorksStackName',
            Description: 'Regional OpsWorks Stack Name',
            Type: 'AWS::SSM::Parameter::Value<String>',
            Default: '/AutoTagTest/OpsWorksStackName'


  resource 'AutoTagTestSecurityGroup', Type: 'AWS::EC2::SecurityGroup', Properties: {
    Tags:                [{ Key: 'Name', Value: 'AutoTagTestSecurityGroup' }],
    GroupDescription:    'AutoTag Test Group',
    VpcId:               ref('AutoTagTestVPC'),
    SecurityGroupEgress: [
      { IpProtocol: '-1', CidrIp: '0.0.0.0/0' }
    ],
    SecurityGroupIngress: [
      { IpProtocol: 'icmp', FromPort: '-1', ToPort: '-1', CidrIp: '0.0.0.0/0' }
    ]
  }

  resource 'AutoTagTestLaunchConfiguration', Type: 'AWS::AutoScaling::LaunchConfiguration', Properties: {
    ImageId:        ref('AmiImageId'),
    InstanceType:   't2.nano',
    KeyName:        ref('KeyName'),
    SecurityGroups: [ref('AutoTagTestSecurityGroup')]
  }

  resource 'AutoTagTestAutoScalingGroup', Type: 'AWS::AutoScaling::AutoScalingGroup', Properties: {
    Tags: [{
      Key:              'Name',
      Value:            'AutoTagTestAutoScalingGroup',
      PropagateAtLaunch: true
    }],
    LaunchConfigurationName: ref('AutoTagTestLaunchConfiguration'),
    DesiredCapacity:         1,
    MinSize:                 1,
    MaxSize:                 1,
    VPCZoneIdentifier:       [ref('AutoTagTestSubnetNAT1')],
    HealthCheckType:         'EC2'
  }

  resource 'AutoTagTestInstance', Type: 'AWS::EC2::Instance', Properties: {
    Tags:             [{ Key: 'Name', Value: 'AutoTagTestInstance' }],
    ImageId:          ref('AmiImageId'),
    InstanceType:     't2.nano',
    KeyName:          ref('KeyName'),
    SecurityGroupIds: [ref('AutoTagTestSecurityGroup')],
    SubnetId:         ref('AutoTagTestSubnetNAT1')
  }

  resource 'AutoTagTestVolume', Type: 'AWS::EC2::Volume', Properties: {
    Tags:             [{ Key: 'Name', Value: 'AutoTagTestVolume' }],
    AvailabilityZone: sub('${AWS::Region}b'),
    Size:             1
  }

  resource 'AutoTagTestElasticIP', Type: 'AWS::EC2::EIP', Properties: {
    # TODO: Add a Name tag here once CloudFormation supports it! Also adjust the audit script.
    Domain: 'vpc'
  }

  resource 'AutoTagTestSubnetNAT1', Type: 'AWS::EC2::Subnet', Properties: {
    Tags:      [{ Key: 'Name', Value: 'AutoTagTestSubnetNAT1' }],
    CidrBlock: select(0, ref('SubnetCidrBlocks')),
    VpcId:     ref('AutoTagTestVPC'),
    AvailabilityZone: sub('${AWS::Region}b')
  }

  resource 'AutoTagTestSubnetNAT2', Type: 'AWS::EC2::Subnet', Properties: {
    Tags:      [{ Key: 'Name', Value: 'AutoTagTestSubnetNAT2' }],
    CidrBlock: select(1, ref('SubnetCidrBlocks')),
    VpcId:     ref('AutoTagTestVPC'),
    AvailabilityZone: sub('${AWS::Region}c')
  }

  resource 'AutoTagTestSubnetIGW', Type: 'AWS::EC2::Subnet', Properties: {
    Tags:      [{ Key: 'Name', Value: 'AutoTagTestSubnetIGW' }],
    CidrBlock: select(2, ref('SubnetCidrBlocks')),
    VpcId:     ref('AutoTagTestVPC'),
    AvailabilityZone: sub('${AWS::Region}c')
  }

  resource 'AutoTagTestVPC', Type: 'AWS::EC2::VPC', Properties: {
    Tags:      [{ Key: 'Name', Value: 'AutoTagTestVPC' }],
    CidrBlock: ref('VpcCidrBlock')
  }

  resource 'AutoTagTestVPCForVpcPeering', Type: 'AWS::EC2::VPC', Properties: {
    Tags:      [{ Key: 'Name', Value: 'AutoTagTestVPCForVpcPeering' }],
    CidrBlock: ref('VpcCidrBlockForVpcPeering')
  }

  resource 'AutoTagTestIGW', Type: 'AWS::EC2::InternetGateway', Properties: {
    Tags:      [{ Key: 'Name', Value: 'AutoTagTestIGW' }]
  }

  resource 'AutoTagTestVPCGatewayAttachment', Type: 'AWS::EC2::VPCGatewayAttachment', Properties: {
      InternetGatewayId: ref('AutoTagTestIGW'),
      VpcId: ref('AutoTagTestVPC')
  }

  resource 'AutoTagTestENI', Type: 'AWS::EC2::NetworkInterface', Properties: {
    Tags:      [{ Key: 'Name', Value: 'AutoTagTestENI' }],
    SubnetId:  ref('AutoTagTestSubnetNAT1')
  }

  resource 'AutoTagTestELBV1', Type: 'AWS::ElasticLoadBalancing::LoadBalancer', Properties: {
    Tags:           [{ Key: 'Name', Value: 'AutoTagTestELBV1' }],
    Scheme:         'internal',
    Subnets:        [ref('AutoTagTestSubnetNAT1')],
    Listeners:      [{
      InstancePort:     80,
      LoadBalancerPort: 80,
      Protocol:         'HTTP'
    }]
  }

  resource 'AutoTagTestELBV2', Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer', Properties: {
    Tags:    [{ Key: 'Name', Value: 'AutoTagTestELBV2' }],
    Scheme:  'internal',
    Subnets: [ref('AutoTagTestSubnetNAT1')],
    Type:    'network'
  }

  resource 'AutoTagTestRDSInstance', Type: 'AWS::RDS::DBInstance', Properties: {
    Tags:               [{ Key: 'Name', Value: 'AutoTagTestRDSInstance' }],
    DBInstanceClass:    'db.t2.micro',
    Engine:             'postgres',
    AllocatedStorage:   20,
    PubliclyAccessible: false,
    MasterUsername:     'AutoTagTestRDS',
    MasterUserPassword: 'asdfasdf!!!!',
    VPCSecurityGroups:  [ref('AutoTagTestSecurityGroup')],
    DBSubnetGroupName:  ref('AutoTagTestRDSDBSubnetGroup')
  }

  resource 'AutoTagTestRDSDBSubnetGroup', Type: 'AWS::RDS::DBSubnetGroup', Properties: {
    Tags: [{ Key: 'Name', Value: 'AutoTagTestRDSDBSubnetGroup' }],
    DBSubnetGroupDescription: 'AutoTagTestRDSDBSubnetGroup',
    SubnetIds: [ref('AutoTagTestSubnetNAT1'), ref('AutoTagTestSubnetNAT2')]
  }

  resource 'AutoTagTestS3Bucket', Type: 'AWS::S3::Bucket', Properties: {
    Tags: [{ Key: 'Name', Value: 'AutoTagTestS3Bucket' }]
  }

  resource 'AutoTagTestEMRCluster', Type: 'AWS::EMR::Cluster', Properties: {
    Tags: [{ Key: 'Name', Value: 'AutoTagTestEMRCluster' }],
    Instances: {
        Ec2KeyName: ref('KeyName'),
        MasterInstanceGroup: {
            InstanceCount: 1,
            InstanceType: 'c1.medium',
            Market: 'ON_DEMAND',
            Name: 'Master'
        },
        CoreInstanceGroup: {
          InstanceCount: 1,
          InstanceType: 'c1.medium',
          Market: 'ON_DEMAND',
          Name: 'Core'
        }
    },
    Name: 'AutoTestTestCluster',
    JobFlowRole: ref('AutoTagTestEMRInstanceProfile'),
    ServiceRole: ref('AutoTagTestEMRRole'),
    ReleaseLabel: 'emr-5.3.0',
    VisibleToAllUsers: true
  }

  resource 'AutoTagTestEMRRole', Type: 'AWS::IAM::Role', Properties: {
    AssumeRolePolicyDocument: {
      Version: '2008-10-17',
      Statement: [{
        Sid: '',
        Effect: 'Allow',
        Principal: { Service: 'elasticmapreduce.amazonaws.com' },
        Action: 'sts:AssumeRole'
      }],
    },
    ManagedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceRole'],
    Path: '/'
  }

  resource 'AutoTagTestEMRRoleForEC2', Type: 'AWS::IAM::Role', Properties: {
    AssumeRolePolicyDocument: {
      Version: '2008-10-17',
      Statement: [{
          Sid: '',
          Effect: 'Allow',
          Principal: { Service: 'ec2.amazonaws.com' },
          Action: 'sts:AssumeRole'
      }],
    },
    ManagedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AmazonElasticMapReduceforEC2Role'],
    Path: '/'
  }


  resource 'AutoTagTestEMRInstanceProfile', Type: 'AWS::IAM::InstanceProfile', Properties: {
    Path: '/',
    Roles: [ref('AutoTagTestEMRRoleForEC2')]
  }

  resource 'AutoTagTestDynamoDBTable', Type: 'AWS::DynamoDB::Table', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestDynamoDBTable' }],
      AttributeDefinitions:  [{ AttributeName: 'NodeID', AttributeType: 'S' }],
      KeySchema:             [{ AttributeName: 'NodeID', KeyType: 'HASH' }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 }
  }

  resource 'AutoTagTestNatGateway', Type: 'AWS::EC2::NatGateway', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestNatGateway' }],
      AllocationId: get_att('AutoTagTestElasticIP', 'AllocationId'),
      SubnetId: ref('AutoTagTestSubnetNAT1')
  }

  resource 'AutoTagTestNetworkACL', Type: 'AWS::EC2::NetworkAcl', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestNetworkACL' }],
      VpcId: ref('AutoTagTestVPC')
  }

  resource 'AutoTagTestRouteTableNAT', Type: 'AWS::EC2::RouteTable', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestRouteTableNAT' }],
      VpcId: ref('AutoTagTestVPC')
  }

  resource 'AutoTagTestRouteTableIGW', Type: 'AWS::EC2::RouteTable', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestRouteTableIGW' }],
      VpcId: ref('AutoTagTestVPC')
  }

  resource 'AutoTagTestRouteNAT', Type: 'AWS::EC2::Route', Properties: {
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: ref('AutoTagTestNatGateway'),
      RouteTableId: ref('AutoTagTestRouteTableNAT')
  }

  resource 'AutoTagTestRouteIGW', Type: 'AWS::EC2::Route', Properties: {
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: ref('AutoTagTestIGW'),
      RouteTableId: ref('AutoTagTestRouteTableIGW')
  }

  resource 'AutoTagTestSubnetRouteTableAssociation1', Type: 'AWS::EC2::SubnetRouteTableAssociation', Properties: {
      SubnetId: ref('AutoTagTestSubnetNAT1'),
      RouteTableId: ref('AutoTagTestRouteTableNAT')
  }

  resource 'AutoTagTestSubnetRouteTableAssociation1b', Type: 'AWS::EC2::SubnetRouteTableAssociation', Properties: {
      SubnetId: ref('AutoTagTestSubnetNAT2'),
      RouteTableId: ref('AutoTagTestRouteTableNAT')
  }

  resource 'AutoTagTestSubnetRouteTableAssociation2', Type: 'AWS::EC2::SubnetRouteTableAssociation', Properties: {
      SubnetId: ref('AutoTagTestSubnetIGW'),
      RouteTableId: ref('AutoTagTestRouteTableIGW')
  }

  resource 'AutoTagTestVpcPeeringConnection', Type: 'AWS::EC2::VPCPeeringConnection', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestVpcPeeringConnection' }],
      VpcId: ref('AutoTagTestVPC'),
      PeerVpcId: ref('AutoTagTestVPCForVpcPeering')
  }

  resource 'AutoTagTestCustomerGateway', Type: 'AWS::EC2::CustomerGateway', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestCustomerGateway' }],
      BgpAsn: 10000,
      IpAddress: '1.1.1.1',
      Type: 'ipsec.1'
  }

  resource 'AutoTagTestVPNGateway', Type: 'AWS::EC2::VPNGateway', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestVPNGateway' }],
      Type: 'ipsec.1'
  }

  resource 'AutoTagTestVPNConnection', Type: 'AWS::EC2::VPNConnection', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestVPNConnection' }],
      Type: 'ipsec.1',
      CustomerGatewayId: ref('AutoTagTestCustomerGateway'),
      StaticRoutesOnly: true,
      VpnGatewayId: ref('AutoTagTestVPNGateway')
  }

  resource 'AutoTagTestOpsworksStack', Type: 'AWS::OpsWorks::Stack', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestOpsworksStack' }],
      VpcId: ref('AutoTagTestVPC'),
      DefaultSubnetId: ref('AutoTagTestSubnetIGW'),
      DefaultInstanceProfileArn: join('', 'arn:aws:iam::', ref('AWS::AccountId'), ':instance-profile/aws-opsworks-ec2-role'),
      ServiceRoleArn: join('', 'arn:aws:iam::', ref('AWS::AccountId'), ':role/aws-opsworks-service-role'),
      DefaultOs: 'Amazon Linux 2017.09',
      Name: ref('OpsWorksStackName')
  }

  resource 'AutoTagTestOpsworksLayer', Type: 'AWS::OpsWorks::Layer', Properties: {
      Tags: [{ Key: 'Name', Value: 'AutoTagTestOpsworksLayer' }],
      AutoAssignElasticIps: true,
      AutoAssignPublicIps: false,
      EnableAutoHealing: false,
      Name: 'AutoTagTestOpsworksLayer1',
      Shortname: 'AutoTagTestLayer1',
      StackId: ref('AutoTagTestOpsworksStack'),
      Type: 'nodejs-app'
  }

  resource 'AutoTagTestOpsworksInstance', Type: 'AWS::OpsWorks::Instance', Properties: {
      InstanceType: 'm3.medium',
      LayerIds: [ref('AutoTagTestOpsworksLayer')],
      StackId: ref('AutoTagTestOpsworksStack'),
      SubnetId: ref('AutoTagTestSubnetIGW'),
      SshKeyName: ref('KeyName'),
      InstallUpdatesOnBoot: false
  }

  resource 'AutoTagTestDataPipeline', Type: 'AWS::DataPipeline::Pipeline', Properties: {
    PipelineTags:    [{ Key: 'Name', Value: 'AutoTagTestPipeline' }],
    Activate:        false,
    Name:            'AutoTagTestDataPipeline',
    PipelineObjects: [
      {
        Id: 'Ec2InstanceStart',
        Name: 'Ec2InstanceStart',
        Fields: [
          {
            Key: 'type',
            StringValue: 'Ec2Resource'
          },
          {
            Key: 'terminateAfter',
            StringValue: '10 Minutes'
          },
          {
            Key: 'instanceType',
            StringValue: 't2.nano'
          },
          {
            Key: 'resourceRole',
            StringValue: 'DataPipelineDefaultResourceRole'
          },
          {
            Key: 'role',
            StringValue: 'DataPipelineDefaultRole'
          },
          {
            Key: 'schedule',
            RefValue: 'DefaultSchedule'
          }
        ]
      },
      {
        Id: 'DefaultSchedule',
        Name: 'RunOnce',
        Fields: [
          {
            Key: 'occurrences',
            StringValue: '1'
          },
          {
            Key: 'startAt',
            StringValue: 'FIRST_ACTIVATION_DATE_TIME'
          },
          {
            Key: 'type',
            StringValue: 'Schedule'
          },
          {
            Key: 'period',
            StringValue: '1 Day'
          }
        ]
      }
    ]
  }


end.exec!
