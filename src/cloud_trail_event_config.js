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
  AMI_CREATE: {
    name: 'ami',
    targetEventName: 'CreateImage',
    targetEventType: null,
    targetEventSource: null
  },
  AMI_COPY: {
    name: 'ami',
    targetEventName: 'CopyImage',
    targetEventType: null,
    targetEventSource: null
  },
  AMI_REGISTER: {
    name: 'ami',
    targetEventName: 'RegisterImage',
    targetEventType: null,
    targetEventSource: null
  },
  SNAPSHOT_CREATE: {
    name: 'snapshot',
    targetEventName: 'CreateSnapshot',
    targetEventType: null,
    targetEventSource: null
  },
  SNAPSHOT_COPY: {
    name: 'snapshot',
    targetEventName: 'CopySnapshot',
    targetEventType: null,
    targetEventSource: null
  },
  SNAPSHOT_IMPORT: {
    name: 'snapshot',
    targetEventName: 'ImportSnapshot',
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
  VPN_CONNECTION: {
    name: 'vpnConnection',
    targetEventName: 'CreateVpnConnection',
    targetEventType: null,
    targetEventSource: null
  },
  VPN_GATEWAY: {
    name: 'vpnGateway',
    targetEventName: 'CreateVpnGateway',
    targetEventType: null,
    targetEventSource: null
  },
  OPS_WORKS: {
    name: 'opsWorks',
    targetEventName: 'CreateStack',
    targetEventType: null,
    targetEventSource: null
  },
  OPS_WORKS_CLONE: {
    name: 'opsWorks',
    targetEventName: 'CloneStack',
    targetEventType: null,
    targetEventSource: null
  },
  IAM_USER: {
    name: 'iamUser',
    targetEventName: 'CreateUser',
    targetEventType: null,
    targetEventSource: null
  },
  IAM_ROLE: {
    name: 'iamRole',
    targetEventName: 'CreateRole',
    targetEventType: null,
    targetEventSource: null
  },
  CUSTOMER_GATEWAY: {
    name: 'customerGateway',
    targetEventName: 'CreateCustomerGateway',
    targetEventType: null,
    targetEventSource: null
  },
  DHCP_OPTIONS: {
    name: 'dhcpOptions',
    targetEventName: 'CreateDhcpOptions',
    targetEventType: null,
    targetEventSource: null
  },
  LAMBDA_FUNCTION_2015: {
    name: 'lambdaFunction',
    targetEventName: 'CreateFunction20150331',
    targetEventType: null,
    targetEventSource: null
  },
  LAMBDA_FUNCTION_2014: {
    name: 'lambdaFunction',
    targetEventName: 'CreateFunction20141111',
    targetEventType: null,
    targetEventSource: null
  },
  CLOUDWATCH_ALARM: {
    name: 'cloudwatchAlarm',
    targetEventName: 'PutMetricAlarm',
    targetEventType: null,
    targetEventSource: null
  },
  CLOUDWATCH_EVENTS_RULE: {
    name: 'cloudwatchEventsRule',
    targetEventName: 'PutRule',
    targetEventType: null,
    targetEventSource: null
  },
  CLOUDWATCH_LOG_GROUP: {
    name: 'cloudwatchLogGroup',
    targetEventName: 'CreateLogGroup',
    targetEventType: null,
    targetEventSource: null
  }
};
