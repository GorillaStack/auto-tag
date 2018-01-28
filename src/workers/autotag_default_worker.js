import * as AWS from 'aws-sdk';
import SETTINGS from "../cloud_trail_event_settings";
export const AUTOTAG_TAG_NAME_PREFIX = 'AutoTag_';
const AUTOTAG_CREATOR_TAG_NAME = AUTOTAG_TAG_NAME_PREFIX + 'Creator';
const AUTOTAG_CREATE_TIME_TAG_NAME = AUTOTAG_TAG_NAME_PREFIX + 'CreateTime';
const AUTOTAG_INVOKED_BY_TAG_NAME = AUTOTAG_TAG_NAME_PREFIX + 'InvokedBy';
const ROLE_PREFIX = 'arn:aws:iam::';
const ROLE_SUFFIX = ':role';
const DEFAULT_STACK_NAME = 'autotag';
const MASTER_ROLE_NAME = 'AutoTagMasterRole';
const MASTER_ROLE_PATH = '/gorillastack/autotag/master/';

class AutotagDefaultWorker {
  constructor(event, s3Region) {
    this.event = event;
    this.s3Region = s3Region;
    this.region = process.env.AWS_REGION;

    // increase the retries for all AWS worker calls to be more resilient
    AWS.config.update({
      retryDelayOptions: {base: 300},
      maxRetries: 8
    });
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
        let cloudFormation = new AWS.CloudFormation({ region: _this.region });
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
          RoleArn: _this.getAssumeRoleArn(roleName),
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

  logTags(resources, tags) {
    console.log("\nTagging " + resources + " in account " + this.getAccountId() + " and region " + this.s3Region + " with " + JSON.stringify(tags));
  }

  getAssumeRoleArn(roleName) {
    let accountId = this.getAccountId();
    return ROLE_PREFIX + accountId + ROLE_SUFFIX + MASTER_ROLE_PATH + roleName;
  }

  // support for older CloudTrail logs
  getAccountId() {
    return (this.event.recipientAccountId ? this.event.recipientAccountId : this.event.userIdentity.accountId);
  }

  getAutotagTags() {
    return [
      this.getAutotagCreatorTag(),
      ...(SETTINGS.AutoTags.CreateTime ? [this.getAutotagCreateTimeTag()] : []),
      ...(this.getInvokedByTagValue() && SETTINGS.AutoTags.InvokedBy ? [this.getAutotagInvokedByTag()] : []),
    ];
  }
  
  getAutotagCreatorTag() {
    return {
      Key: this.getCreatorTagName(),
      Value: this.getCreatorTagValue()
    };
  }

  getAutotagCreateTimeTag() {
    return {
      Key: this.getCreateTimeTagName(),
      Value: this.getCreateTimeTagValue()
    };
  }

  getAutotagInvokedByTag() {
    return {
      Key: this.getInvokedByTagName(),
      Value: this.getInvokedByTagValue()
    };
  }

  getCreatorTagName() {
    return AUTOTAG_CREATOR_TAG_NAME;
  }

  getCreatorTagValue() {
    // prefer the this field for Federated Users
    // because it is the actual aws user and isn't truncated
    if (this.event.userIdentity.type === 'FederatedUser' &&
        this.event.userIdentity.sessionContext &&
        this.event.userIdentity.sessionContext.sessionIssuer &&
        this.event.userIdentity.sessionContext.sessionIssuer.arn) {
      return this.event.userIdentity.sessionContext.sessionIssuer.arn;
    } else {
      return this.event.userIdentity.arn;
    }
  }

  getCreateTimeTagName() {
    return AUTOTAG_CREATE_TIME_TAG_NAME;
  }

  getCreateTimeTagValue() {
    return this.event.eventTime;
  }

  getInvokedByTagName() {
    return AUTOTAG_INVOKED_BY_TAG_NAME;
  }

  getInvokedByTagValue() {
    return (this.event.userIdentity && this.event.userIdentity.invokedBy ? this.event.userIdentity.invokedBy : false);
  }

};

export default AutotagDefaultWorker;
