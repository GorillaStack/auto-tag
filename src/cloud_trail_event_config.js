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
    targetEventName: '',
    targetEventType: '',
    targetEventSource: ''
  },
  VPC: {
    name: 'vpc',
    targetEventName: '',
    targetEventType: '',
    targetEventSource: ''
  },
  SUBNETS: {
    name: 'subnets',
    targetEventName: '',
    targetEventType: '',
    targetEventSource: ''
  },
  ELB: {
    name: 'elb',
    targetEventName: '',
    targetEventType: '',
    targetEventSource: ''
  },
  EBS: {
    name: 'ebs',
    targetEventName: '',
    targetEventType: '',
    targetEventSource: ''
  },
  SECURITY_GROUP: {
    name: 'securityGroup',
    targetEventName: 'CreateSecurityGroup',
    targetEventType: null,
    targetEventSource: null
  }
};
