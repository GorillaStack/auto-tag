const AutotagEC2Worker = require('./autotag_ec2_worker');
const AWS = require('aws-sdk');

class AutotagVPCWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created VPC
  */

  tagResource() {
    return this.tagEC2Resources([this.getVPCId()]);
  }

  getVPCId() {
    return this.event.responseElements.vpc.vpcId;
  }
};

export default AutotagVPCWorker;
