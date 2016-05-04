import AWS from 'aws-sdk';
const AUTOTAG_TAG_NAME = 'AutoTag_Creator';
const ROLE_PREFIX = 'arn:aws:iam::';
const ROLE_SUFFIX = ':role';
const DEFAULT_STACK_NAME = 'autotag';
const MASTER_ROLE_NAME = 'AutoTagMasterRole';
const MASTER_ROLE_PATH = '/gorillastack/autotag/master/';

class AutotagDefaultWorker {
  constructor(event, s3Region) {
    this.event = event;
    this.s3Region = s3Region;
  }

  /* tagResource
  ** method: tagResource
  **
  ** Do nothing
  */
  tagResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        // Do nothing
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  }

  getRoleName() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let cloudFormation = new AWS.CloudFormation({ region: _this.s3Region });
        cloudFormation.describeStackResource({
          StackName: DEFAULT_STACK_NAME,
          LogicalResourceId: MASTER_ROLE_NAME
        }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.StackResourceDetail.PhysicalResourceId);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  assumeRole(roleName) {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        AWS.config.region = 'us-east-1';
        let sts = new AWS.STS();
        sts.assumeRole({
          RoleArn: ROLE_PREFIX + _this.event.recipientAccountId + ROLE_SUFFIX + MASTER_ROLE_PATH + roleName,
          RoleSessionName: 'AutoTag-' + (new Date()).getTime(),
          DurationSeconds: 900
        }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            let credentials = {
              accessKeyId: data.Credentials.AccessKeyId,
              secretAccessKey: data.Credentials.SecretAccessKey,
              sessionToken: data.Credentials.SessionToken
            };
            resolve(credentials);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  dumpEventInfo() {
    console.log('Event Name: ' + this.event.eventName);
    console.log('Event Type: ' + this.event.eventType);
    console.log('Event Source: ' + this.event.eventSource);
    console.log('AWS Region: ' + this.event.awsRegion);
    console.log('---');
  }

  getAutotagPair() {
    return {
      Key: this.getTagName(),
      Value: this.getTagValue()
    };
  }

  getTagName() {
    return AUTOTAG_TAG_NAME;
  }

  getTagValue() {
    return this.event.userIdentity.arn;
  }
};

export default AutotagDefaultWorker;
