import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';

class AutotagRDSWorker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
  }

  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created RDS instance
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let credentials = yield _this.assumeRole();
      _this.rds = new AWS.RDS({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagRDSResource();
    });
  }

  tagRDSResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.rds.addTagsToResource({
          ResourceName: _this.getDbARN(),
          Tags: [
            _this.getAutotagPair()
          ]
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
