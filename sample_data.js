module.exports = {
  Records: [
    {
      eventVersion: '2.0',
      eventSource: 'aws:s3',
      awsRegion: 'ap-northeast-1',
      eventTime: '2015-09-11T03:20:59.155Z',
      eventName: 'ObjectCreated:Put',
      userIdentity: {
        principalId: 'AWS:AROAIPOEHXEMYWYY6EMLG:i-19e872eb'
      },
      requestParameters: {
        sourceIPAddress: '52.69.142.61'
      },
      responseElements: {
        'x-amz-request-id': '0E14F7F4EA235F69',
        'x-amz-id-2': 'WZNoByyvNgcOhP8CmfbbummtJNxICFpNCfFByhPIRVvvIrO9SvakxwS9NDkGFZnc9e2NfqaH37I='
      },
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: 'YjQ3OWI0OWItYmY4Zi00MjVmLTg3MTItNjk1NTU0OGNmNDkz',
        bucket: {
          name: 'autotag-cloudtrail-logs',
          ownerIdentity: {
            principalId: 'A2OB0Q5JPT1H5J'
          },
          arn: 'arn:aws:s3:::autotag-cloudtrail-logs'
        },
        object: {
          key: 'AWSLogs/002790823159/CloudTrail/ap-northeast-1/2015/09/17/002790823159_CloudTrail_ap-northeast-1_20150917T0355Z_YJL50enR0WAUpwew.json.gz',
          size: 2858,
          eTag: '1dca20ce134f8165f2ec7508cda93b39',
          sequencer: '0055F2489B160B9FA4'
        }
      }
    }
  ]
};
