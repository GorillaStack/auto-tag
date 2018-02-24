import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';
import _ from "underscore";

class AutotagDynamoDBWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag DynamoDB table resources
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = _this.roleName;
      let credentials = yield _this.assumeRole(roleName);
      _this.dynamoDB = new AWS.DynamoDB({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagDynamoDBResource();
    });
  }

  tagDynamoDBResource(retries = 9) {
    let _this = this;
    let retryInterval = 5000;
    let tags = _this.getAutotagTags();
    let delay = (time) => (result) => new Promise(resolve => setTimeout(() => resolve(result), time));
    let dynamoDBTableARN = _this.getDynamoDBTableARN();
    return new Promise((resolve, reject) => {
      try {
        _this.dynamoDB.listTagsOfResource({
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
    }).then(function (res) {
      if (_this.cloudFormationDynamoDBTagsWaiter(res, tags, retries)) {
        console.log('Waiting for any tags from the resource creation to appear on the resource, retrying tagging in ' + (retryInterval/1000) + ' secs...');
        return new Promise((resolve) => resolve(res)).then(delay(retryInterval)).then(result => {
          return result
        });
      } else {
        return res;
      }
    }).then(function (res) {
      // if we tag before cloudformation has a chance to apply its tags our tags
      // will be lost, so wait a few times before giving up and tagging anyways
      if (_this.cloudFormationDynamoDBTagsWaiter(res, tags, retries)) {
        return _this.tagDynamoDBResource(retries - 1);
      } else {
        return new Promise((resolve, reject) => {
          try {
            _this.logTags(dynamoDBTableARN, tags, _this.constructor.name);
            _this.dynamoDB.tagResource({
              ResourceArn: dynamoDBTableARN,
              Tags: tags
            }, (err, res) => {
              if (err) {
                reject(err);
              } else {
                resolve(true);
              }
            });
          } catch (e) {
            reject(e);
          }
        })
      }
    });
  }

  cloudFormationDynamoDBTagsWaiter(res, tags, retries) {
    // only apply this waiter if the resource was created
    // otherwise it will slow down the s3 log based tagging too much
    let createTime = new Date(this.getCreateTimeTagValue());
    let createTimeNowDiff = (((Date.now() - createTime) / 1000) / 60);
    return (
      retries > 0 &&
      res.Tags.length === 0 &&
      createTimeNowDiff <= 4 && // minutes
      this.isInvokedByCloudFormation()
    )
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

};

export default AutotagDynamoDBWorker;
