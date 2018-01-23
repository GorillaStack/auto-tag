import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';

class AutotagRDSWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created RDS instance
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
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
        let dbArn = _this.getDbARN();
        let tags = _this.getAutotagTags();
        _this.logTags(dbArn, tags);
        _this.rds.addTagsToResource({
          ResourceName: dbArn,
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

  /*
  ** getDbARN
  **
  ** Used to construct an ARN for the db instance
  ** http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_Tagging.html#USER_Tagging.ARN
  ** arn format: arn:aws:rds:<region>:<account number>:<resourcetype>:<name>
  ** resourcetype = 'db' in this instance
  */

  getDbARN() {
    if (this.event.responseElements.dBInstanceArn) {
      return this.event.responseElements.dBInstanceArn;
    } else {
      let arnComponents = ['arn', 'aws', 'rds'];
      arnComponents.push(this.event.awsRegion);
      arnComponents.push(this.getAccountId());
      arnComponents.push('db');
      arnComponents.push(this.event.responseElements.dBInstanceIdentifier);
      return arnComponents.join(':');
    }
  }


};

export default AutotagRDSWorker;
