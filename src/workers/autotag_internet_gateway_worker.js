const AutotagEC2Worker = require('./autotag_ec2_worker');
const AWS = require('aws-sdk');
const co = require('co');

class AutotagInternetGatewayWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Autotag elastic block storage volumes that are created.
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      yield _this.assumeRole(AWS);
      yield _this.tagEC2Resources([_this.getInternetGatewayId()]);
    });
  }

  getInternetGatewayId() {
    return this.event.responseElements.internetGateway.internetGatewayId;
  }
};

export default AutotagInternetGatewayWorker;
