import AWS from 'aws-sdk';
import AutotagDefaultWorker from './autotag_default_worker.js';

class AutotagEMRWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag EMR cluster and associated resources
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.emr = new AWS.EMR({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagEMRResource();
  }

  tagEMRResource() {
    return new Promise((resolve, reject) => {
      try {
        const emrClusterId = this.getEMRClusterId();
        const tags = this.getAutotagTags();
        this.logTags(emrClusterId, tags, this.constructor.name);
        this.emr.addTags({
          ResourceId: emrClusterId,
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

  getEMRClusterId() {
    return this.event.responseElements.jobFlowId;
  }
}

export default AutotagEMRWorker;
