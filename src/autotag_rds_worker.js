const AutotagDefaultWorker = require('./autotag_default_worker');
const AWS = require('aws-sdk');

class AutotagRDSWorker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
    this.rds = new AWS.RDS({region: event.awsRegion});
  }

  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created RDS instance
  */

  tagResource() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        _this.rds.addTagsToResource({
          ResourceName: _this.getDbARN(),
          Tags: [
            _this.getAutotagPair()
          ]
        }, function(err, res) {
          if (err)
            reject(err);
          else
            resolve(true);
        });
      } catch(e) {
        reject(e);
      }
    });
  }

  /*
  ** getDbARN
  **
  ** Used to construct an ARN for the db instance
  ** http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Tagging.html#USER_Tagging.ARN
  ** arn format: arn:aws:rds:<region>:<account number>:<resourcetype>:<name>
  ** resourcetype = 'db' in this instance
  */

  getDbARN() {
    let arnComponents = ['arn', 'aws', 'rds'];
    arnComponents.push(this.event.awsRegion);
    arnComponents.push(this.event.recipientAccountId);
    arnComponents.push('db');
    arnComponents.push(this.event.responseElements.dBInstanceIdentifier);
    return arnComponents.join(':');
  }
};

export default AutotagRDSWorker;
