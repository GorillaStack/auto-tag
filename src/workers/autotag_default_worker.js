import get from 'lodash/get.js';
import * as AWS from 'aws-sdk';
import SETTINGS from '../autotag_settings.js';

export const AUTOTAG_TAG_NAME_PREFIX = 'AutoTag_';
const AUTOTAG_CREATOR_TAG_NAME = `${AUTOTAG_TAG_NAME_PREFIX}Creator`;
const AUTOTAG_CREATE_TIME_TAG_NAME = `${AUTOTAG_TAG_NAME_PREFIX}CreateTime`;
const AUTOTAG_INVOKED_BY_TAG_NAME = `${AUTOTAG_TAG_NAME_PREFIX}InvokedBy`;
const ROLE_PREFIX = 'arn:aws:iam::';
const ROLE_SUFFIX = ':role';
// const MASTER_ROLE_NAME = 'AutoTagMasterRole';
const MASTER_ROLE_PATH = '/gorillastack/autotag/master/';

class AutotagDefaultWorker {
  constructor(event, s3Region) {
    this.event = event;
    this.s3Region = s3Region;
    this.region = process.env.AWS_REGION;
    this.roleName = process.env.ROLE_NAME;

    // increase the retries for all AWS worker calls to be more resilient
    // AWS.config.update({
    //   retryDelayOptions: {base: 300},
    //   maxRetries: 8
    // });
  }

  /* tagResource
  ** method: tagResource
  **
  ** Do nothing
  */

  tagResource() {
    return new Promise((resolve, reject) => {
      try {
        // Do nothing
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  }

  assumeRole(roleName) {
    return new Promise((resolve, reject) => {
      try {
        AWS.config.region = 'us-east-1';
        //Uncomment line below for AWS STS logging
        //AWS.config.logger = console;
        const sts = new AWS.STS();
        sts.assumeRole({
          RoleArn: this.getAssumeRoleArn(roleName),
          RoleSessionName: `AutoTag-${(new Date()).getTime()}`,
          DurationSeconds: 900
        }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            const credentials = {
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
    console.log(`Event Name: ${this.event.eventName}`);
    console.log(`Event Type: ${this.event.eventType}`);
    console.log(`Event Source: ${this.event.eventSource}`);
    console.log(`AWS Region: ${this.event.awsRegion}`);
    console.log('---');
  }

  logTags(resources, tags, worker) {
    console.log(`\nTagging ${resources} with the ${worker} in ${this.getAccountId()} (${this.s3Region}):`);
    console.log(JSON.stringify(tags, null, 2));
  }

  getAssumeRoleArn(roleName) {
    const accountId = this.getAccountId();
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
      ...this.getCustomTags()
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
    if (this.event.userIdentity.type === 'FederatedUser'
        && this.event.userIdentity.sessionContext
        && this.event.userIdentity.sessionContext.sessionIssuer
        && this.event.userIdentity.sessionContext.sessionIssuer.arn) {
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

  getCustomTags() {
    const keyword = '$event.';
    // substitute any word starting with the keyword in the tag value with the actual value from the event
    return this.objectMap(JSON.parse(SETTINGS.CustomTags), tagValue => {
      let newTagValue = tagValue;
      // split up the tag value by any character except these
      const tagValueVariables = tagValue.match(/\$[A-Za-z0-9.]+/g) || [];

      tagValueVariables.forEach(tagValueVariable => {
        const tagValueVariableReplacement = get(this.event, tagValueVariable.replace(keyword, ''), undefined);

        if (tagValueVariableReplacement === undefined) {
          console.log(`WARN: Failed to perform the variable substitution for ${tagValueVariable}`);
        }
        // replace the variable in the tag value with the associated event value
        newTagValue = newTagValue.replace(tagValueVariable, tagValueVariableReplacement);
      });
      // if all of the variable substitutions in the tag value have failed drop the entire tag
      if (tagValueVariables.length > 0 && tagValueVariables.length === (newTagValue.match(/undefined/g) || []).length) {
        return false;
      }

      return newTagValue;
    });
  }

  // returns a new array with the values at each key mapped using mapFn(value)
  objectMap(object, mapFn) {
    return Object.keys(object).reduce((result, key) => {
      const newValue = mapFn(object[key]);
      if (newValue) result.push({ Key: key, Value: newValue });
      return result;
    }, []);
  }
}

export default AutotagDefaultWorker;
