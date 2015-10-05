const AutotagEC2Worker = require('./autotag_ec2_worker');
const AWS = require('aws-sdk');
const co = require('co');

class AutotagVPCWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created VPC
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      yield _this.assumeRole(AWS);
      yield _this.tagEC2Resources([_this.getVPCId()]);
    });
  }

  getVPCId() {
    return this.event.responseElements.vpc.vpcId;
  }
};

export default AutotagVPCWorker;
