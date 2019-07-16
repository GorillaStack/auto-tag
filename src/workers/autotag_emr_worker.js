import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';


class AutotagEMRWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag EMR cluster and associated resources
  */

  async tagResource() {
    let roleName = this.roleName;
    let credentials = await this.assumeRole(roleName);
    this.emr = new AWS.EMR({
      region: this.event.awsRegion,
      credentials: credentials
    });
    await this.tagEMRResource();
  }

  tagEMRResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let emrClusterId = _this.getEMRClusterId();
        let tags = _this.getAutotagTags();
        _this.logTags(emrClusterId, tags, _this.constructor.name);
        _this.emr.addTags({
          ResourceId: emrClusterId,
          Tags: tags
        }, (err, res) => {
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
