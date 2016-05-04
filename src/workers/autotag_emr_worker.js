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
      let roleName = yield _this.getRoleName();
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
        _this.emr.addTags({
          ResourceId: _this.getEMRClusterId(),
          Tags: [
            _this.getAutotagPair()
          ]
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
