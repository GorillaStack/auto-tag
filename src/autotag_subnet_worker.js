const AutotagEC2Worker = require('./autotag_ec2_worker');
const AWS = require('aws-sdk');

class AutotagSubnetWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created VPC
  */

  tagResource() {
    return this.tagEC2Resources([this.getSubnetId()]);
  }

  getSubnetId() {
    return this.event.responseElements.subnet.subnetId;
  }
};

export default AutotagSubnetWorker;
