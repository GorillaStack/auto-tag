export default {
  EC2: {
    name: 'ec2',
    targetEventName: 'RunInstances',
    targetEventType: null,
    targetEventSource: null
  },
  S3: {
    name: 's3',
    targetEventName: 'CreateBucket',
    targetEventType: null,
    targetEventSource: null
  },
  AUTOSCALE_GROUPS: {
    name: 'autoscaleGroups',
    targetEventName: 'CreateAutoScalingGroup',
    targetEventType: null,
    targetEventSource: null
  },
  VPC: {
    name: 'vpc',
    targetEventName: 'CreateVpc',
    targetEventType: null,
    targetEventSource: null
  },
  SUBNETS: {
    name: 'subnets',
    targetEventName: 'CreateSubnet',
    targetEventType: null,
    targetEventSource: null
  },
  ELB: {
    name: 'elb',
    targetEventName: 'CreateLoadBalancer',
    targetEventType: null,
    targetEventSource: null
  },
  EBS: {
    name: 'ebs',
    targetEventName: 'CreateVolume',
    targetEventType: null,
    targetEventSource: null
  },
  INTERNET_GATEWAY: {
    name: 'internetGateway',
    targetEventName: 'CreateInternetGateway',
    targetEventType: null,
    targetEventSource: null
  },
  SECURITY_GROUP: {
    name: 'securityGroup',
    targetEventName: 'CreateSecurityGroup',
    targetEventType: null,
    targetEventSource: null
  },
  RDS: {
    name: 'rds',
    targetEventName: 'CreateDBInstance',
    targetEventType: null,
    targetEventSource: null
  },
  EMR: {
    name: 'emr',
    targetEventName: 'RunJobFlow',
    targetEventType: null,
    targetEventSource: null
  },
  DATA_PIPELINE: {
    name: 'dataPipeline',
    targetEventName: 'CreatePipeline',
    targetEventType: null,
    targetEventSource: null
  },
  AMI: {
    name: 'ami',
    targetEventName: 'CreateImage',
    targetEventType: null,
    targetEventSource: null
  },
  SNAPSHOT: {
    name: 'snapshot',
    targetEventName: 'CreateSnapshot',
    targetEventType: null,
    targetEventSource: null
  },
  ELASTIC_IP: {
    name: 'elasticIP',
    targetEventName: 'AllocateAddress',
    targetEventType: null,
    targetEventSource: null
  },
  DYNAMO_DB: {
    name: 'dynamoDB',
    targetEventName: 'CreateTable',
    targetEventType: null,
    targetEventSource: null
  },
  ENI: {
    name: 'eni',
    targetEventName: 'CreateNetworkInterface',
    targetEventType: null,
    targetEventSource: null
  },
  NAT_GATEWAY: {
    name: 'natGateway',
    targetEventName: 'CreateNatGateway',
    targetEventType: null,
    targetEventSource: null
  },
  NETWORK_ACL: {
    name: 'networkACL',
    targetEventName: 'CreateNetworkAcl',
    targetEventType: null,
    targetEventSource: null
  },
  ROUTE_TABLE: {
    name: 'routeTable',
    targetEventName: 'CreateRouteTable',
    targetEventType: null,
    targetEventSource: null
  },
  VPC_PEERING: {
    name: 'vpcPeering',
    targetEventName: 'CreateVpcPeeringConnection',
    targetEventType: null,
    targetEventSource: null
  },
  VPN: {
    name: 'vpn',
    targetEventName: 'CreateVpnConnection',
    targetEventType: null,
    targetEventSource: null
  }
};
