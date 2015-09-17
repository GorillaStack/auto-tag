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
    targetEventName: null,
    targetEventType: null,
    targetEventSource: null
  },
  SECURITY_GROUP: {
    name: 'securityGroup',
    targetEventName: 'CreateSecurityGroup',
    targetEventType: null,
    targetEventSource: null
  }
};
