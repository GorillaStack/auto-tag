import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';

class AutotagDynamoDBWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag DynamoDB table resources
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
      _this.dynamoDB = new AWS.DynamoDB({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagDynamoDBResource();
    });
  }

  tagDynamoDBResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let dynamoDBTableARN = _this.getDynamoDBTableARN();
        let tags = _this.getAutotagTags();
        _this.logTags(dynamoDBTableARN, tags);
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
    });
  }

  getDynamoDBTableARN() {
    return this.event.responseElements.tableDescription.tableArn;
  }

};

export default AutotagDynamoDBWorker;
