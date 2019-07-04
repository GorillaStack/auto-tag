import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';

class AutotagEMRWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag EMR cluster and associated resources
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = _this.roleName;
      let credentials = yield _this.assumeRole(roleName);
      _this.emr = new AWS.EMR({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagEMRResource();
    });
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

};

export default AutotagEMRWorker;
