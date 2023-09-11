import { DynamoDB } from "@aws-sdk/client-dynamodb";
import AutotagDefaultWorker from './autotag_default_worker.js';

class AutotagDynamoDBWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag DynamoDB table resources
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.dynamoDB = new DynamoDB({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagDynamoDBResource();
  }

  tagDynamoDBResource(retries = 9) {
    const retryInterval = 5000;
    const tags = this.getAutotagTags();
    const delay = time => result => new Promise(resolve => setTimeout(() => resolve(result), time));
    const dynamoDBTableARN = this.getDynamoDBTableARN();
    return new Promise((resolve, reject) => {
      try {
        this.dynamoDB.listTagsOfResource({
          ResourceArn: dynamoDBTableARN
        }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      } catch (e) {
        reject(e);
      }
    }).then(res => {
      if (this.cloudFormationDynamoDBTagsWaiter(res, tags, retries)) {
        console.log(`Waiting for any tags from the resource creation to appear on the resource, retrying tagging in ${retryInterval / 1000} secs...`);
        return new Promise(resolve => resolve(res)).then(delay(retryInterval)).then(result => result);
      } else {
        return res;
      }
    }).then(res => {
      // if we tag before cloudformation has a chance to apply its tags our tags
      // will be lost, so wait a few times before giving up and tagging anyways
      if (this.cloudFormationDynamoDBTagsWaiter(res, tags, retries)) {
        return this.tagDynamoDBResource(retries - 1);
      } else {
        return new Promise((resolve, reject) => {
          try {
            this.logTags(dynamoDBTableARN, tags, this.constructor.name);
            this.dynamoDB.tagResource({
              ResourceArn: dynamoDBTableARN,
              Tags: tags
            }, err => {
              if (err) {
                reject(err);
              } else {
                resolve(true);
              }
            });
          } catch (e) {
            reject(e);
          }
        });
      }
    });
  }

  cloudFormationDynamoDBTagsWaiter(res, tags, retries) {
    // only apply this waiter if the resource was created
    // otherwise it will slow down the s3 log based tagging too much
    const createTime = new Date(this.getCreateTimeTagValue());
    const createTimeNowDiff = (((Date.now() - createTime) / 1000) / 60);
    return (
      retries > 0
      && res.Tags.length === 0
      && createTimeNowDiff <= 4 // minutes
      && this.isInvokedByCloudFormation()
    );
  }

  isInvokedByCloudFormation() {
    return (this.getInvokedBy() === 'cloudformation.amazonaws.com');
  }

  getInvokedBy() {
    return this.event.userIdentity.invokedBy;
  }

  getDynamoDBTableARN() {
    return this.event.responseElements.tableDescription.tableArn;
  }
}

export default AutotagDynamoDBWorker;
