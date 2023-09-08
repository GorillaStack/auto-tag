import AWS from 'aws-sdk';
import AutotagDefaultWorker from './autotag_default_worker.js';


class AutotagRDSWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created RDS instance
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.rds = new AWS.RDS({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagRDSResource();
  }

  tagRDSResource() {
    return new Promise((resolve, reject) => {
      try {
        const dbArn = this.getDbARN();
        const tags = this.getAutotagTags();
        this.logTags(dbArn, tags, this.constructor.name);
        this.rds.addTagsToResource({
          ResourceName: dbArn,
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
      const arnComponents = ['arn', 'aws', 'rds'];
      arnComponents.push(this.event.awsRegion);
      arnComponents.push(this.getAccountId());
      arnComponents.push('db');
      arnComponents.push(this.event.responseElements.dBInstanceIdentifier);
      return arnComponents.join(':');
    }
  }
}

export default AutotagRDSWorker;
