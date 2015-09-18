const AutotagEC2Worker = require('./autotag_ec2_worker');
const AWS = require('aws-sdk');

class AutotagInternetGatewayWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Autotag elastic block storage volumes that are created.
  */

  tagResource() {
    return this.tagEC2Resources([this.getInternetGatewayId()]);
  }

  getInternetGatewayId() {
    return this.event.responseElements.internetGateway.internetGatewayId;
  }
};

export default AutotagInternetGatewayWorker;
