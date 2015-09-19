module.exports = {
  Records: [
    {
      eventVersion: '2.0',
      eventSource: 'aws:s3',
      awsRegion: 'ap-northeast-1',
      eventTime: '2015-09-11T03:20:59.155Z',
      eventName: 'ObjectCreated:Put',
      userIdentity: {
        principalId: '[PRINCIPAL_ID]'
      },
      requestParameters: {
        sourceIPAddress: '[IP_ADDRESS]'
      },
      responseElements: {
        'x-amz-request-id': '0E14F7F4EA235F69',
        'x-amz-id-2': 'WZNoByyvNgcOhP8CmfbbummtJNxICFpNCfFByhPIRVvvIrO9SvakxwS9NDkGFZnc9e2NfqaH37I='
      },
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: 'YjQ3OWI0OWItYmY4Zi00MjVmLTg3MTItNjk1NTU0OGNmNDkz',
        bucket: {
          name: '[AUTOTAG_BUCKET_NAME]',
          ownerIdentity: {
            principalId: '[PRINCIPAL_ID]'
          },
          arn: 'arn:aws:s3:::[AUTOTAG_BUCKET_NAME]'
        },
        object: {
          key: 'AWSLogs/[YOUR_ACCOUNT_ID]/CloudTrail/ap-northeast-1/2015/09/18/[FILE_NAME].json.gz',
          size: 2858,
          eTag: '1dca20ce134f8165f2ec7508cda93b39',
          sequencer: '0055F2489B160B9FA4'
        }
      }
    }
  ]
};
