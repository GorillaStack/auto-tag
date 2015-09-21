module.exports = {
  eventVersion: '1.02',
  userIdentity: {
    type: 'IAMUser',
    principalId: '[PRINCIPAL_ID]',
    arn: 'arn:aws:iam::[AWS_ACCOUNT_ID]:user/[USER_NAME]',
    accountId: '[AWS_ACCOUNT_ID]',
    accessKeyId: '[ACCESS_KEY_ID]',
    userName: '[USER_NAME]',
    sessionContext: {
      attributes: {
        mfaAuthenticated: 'true',
        creationDate: '2015-09-16T04:08:23Z'
      }
    },
    invokedBy: 'signin.amazonaws.com'
  },
  eventTime: '2015-09-16T05:31:20Z',
  eventSource: 'ec2.amazonaws.com',
  eventName: 'RunInstances',
  awsRegion: 'ap-northeast-1',
  sourceIPAddress: '[IP_ADDRESS]',
  userAgent: 'signin.amazonaws.com',
  requestParameters: {
    instancesSet: {
      items: [
        {
          imageId: 'ami-1c1b9f1c',
          minCount: 1,
          maxCount: 1
        }
      ]
    },
    groupSet: {
      items: [
        {
          groupId: 'sg-c0eca0a0'
        }
      ]
    },
    instanceType: 't2.micro',
    blockDeviceMapping: {
      items: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 8,
            deleteOnTermination: true,
            volumeType: 'gp2'
          }
        }
      ]
    },
    monitoring: {
      enabled: false
    },
    disableApiTermination: false,
    clientToken: 'njeaF1442381479667',
    ebsOptimized: false
  },
  responseElements: {
    reservationId: 'r-1710f8e5',
    ownerId: '[AWS_ACCOUNT_ID]',
    groupSet: {},
    instancesSet: {
      items: [
        {
          instanceId: 'i-e38a6646',
          imageId: 'ami-1c1b9f1c',
          instanceState: {
            code: 0,
            name: 'pending'
          },
          privateDnsName: 'ip-172-31-26-223.ap-northeast-1.compute.internal',
          amiLaunchIndex: 0,
          productCodes: {},
          instanceType: 't2.micro',
          launchTime: 1442381480000,
          placement: {
            availabilityZone: 'ap-northeast-1a',
            tenancy: 'default'
          },
          monitoring: {
            state: 'disabled'
          },
          subnetId: 'subnet-0cb00d0b',
          vpcId: 'vpc-000ba000',
          privateIpAddress: '172.31.26.223',
          stateReason: {
            code: 'pending',
            message: 'pending'
          },
          architecture: 'x86_64',
          rootDeviceType: 'ebs',
          rootDeviceName: '/dev/xvda',
          blockDeviceMapping: {},
          virtualizationType: 'hvm',
          hypervisor: 'xen',
          clientToken: 'njeaF1442381479667',
          interfaceId: 'interface-5e8c9528',
          groupSet: {
            items: [
              {
                groupId: 'sg-c6eca7a3',
                groupName: 'launch-wizard-2'
              }
            ]
          },
          sourceDestCheck: true,
          networkInterfaceSet: {
            items: [
              {
                networkInterfaceId: 'eni-5e8c9528',
                internalInterfaceId: 'interface-5e8c9528',
                subnetId: 'subnet-0cb00d0b',
                vpcId: 'vpc-000ba000',
                availabilityZone: 'ap-northeast-1a',
                ownerId: '[AWS_ACCOUNT_ID]',
                requesterManaged: false,
                status: 'in-use',
                macAddress: '06:ab:72:41:26:b3',
                privateIpAddress: '172.31.26.223',
                privateDnsName: 'ip-172-31-26-223.ap-northeast-1.compute.internal',
                sourceDestCheck: true,
                groupSet: {
                  items: [
                    {
                      groupId: 'sg-c0eca0a0',
                      groupName: 'launch-wizard-2'
                    }
                  ]
                },
                attachment: {
                  attachmentId: 'eni-attach-45a74c5e',
                  instanceId: '3423151686',
                  instanceOwnerId: '[AWS_ACCOUNT_ID]',
                  deviceIndex: 0,
                  status: 'attaching',
                  attachTime: 1442381480000,
                  deleteOnTermination: true
                },
                attachableToInstanceBySet: {},
                associableWithElasticIpBySet: {},
                privateIpAddressesSet: {
                  item: [
                    {
                      privateIpAddress: '172.31.26.223',
                      privateDnsName: 'ip-172-31-26-223.ap-northeast-1.compute.internal',
                      primary: true
                    }
                  ]
                },
                tagSet: {}
              }
            ]
          },
          ebsOptimized: false
        }
      ]
    }
  },
  requestID: '371bfe0f-c883-4612-af72-0f9cca00a766',
  eventID: '01db8111-5bf5-43ec-a075-ce318ec46574',
  eventType: 'AwsApiCall',
  recipientAccountId: '[AWS_ACCOUNT_ID]'
};
