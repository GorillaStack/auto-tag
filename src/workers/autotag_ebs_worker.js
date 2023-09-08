import AWS from 'aws-sdk';
import AutotagEC2Worker from './autotag_ec2_worker.js';

class AutotagEBSWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Autotag elastic block storage volumes that are created.
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.ec2 = new AWS.EC2({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagEC2Resources([this.getVolumeId()]);
  }

  getVolumeId() {
    return this.event.responseElements.volumeId;
  }
}

export default AutotagEBSWorker;
