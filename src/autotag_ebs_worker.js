const AutotagEC2Worker = require('./autotag_ec2_worker');
const AWS = require('aws-sdk');

class AutotagEBSWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Autotag elastic block storage volumes that are created.
  */

  tagResource() {
    return this.tagEC2Resources([this.getVolumeId()]);
  }

  getVolumeId() {
    return this.event.responseElements.volumeId;
  }
};

export default AutotagEBSWorker;
