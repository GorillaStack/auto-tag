const AutotagEC2Worker = require('./autotag_ec2_worker');
const AWS = require('aws-sdk');
const co = require('co');

class AutotagEBSWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Autotag elastic block storage volumes that are created.
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let credentials = yield _this.assumeRole();
      _this.ec2 = new AWS.EC2({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagEC2Resources([_this.getVolumeId()]);
    });
  }

  getVolumeId() {
    return this.event.responseElements.volumeId;
  }
};

export default AutotagEBSWorker;
