const AutotagEC2Worker = require('./autotag_ec2_worker');
const AWS = require('aws-sdk');
const co = require('co');

class AutotagSubnetWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created VPC
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      yield _this.assumeRole(AWS);
      yield _this.tagEC2Resources([_this.getSubnetId()]);
    });
  }

  getSubnetId() {
    return this.event.responseElements.subnet.subnetId;
  }
};

export default AutotagSubnetWorker;
