const AutotagDefaultWorker = require('./autotag_default_worker');
const AWS = require('aws-sdk');

class AutotagEMRWorker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
    this.emr = new AWS.EMR({region: event.awsRegion});
  }

  /* tagResource
  ** method: tagResource
  **
  ** Tag EMR cluster and associated resources
  */

  tagResource() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        _this.emr.addTags({
          ResourceId: _this.getEMRClusterId(),
          Tags: [
            _this.getAutotagPair()
          ]
        }, function(err, res) {
          if (err)
            reject(err);
          else
            resolve(true);
        });
      } catch(e) {
        reject(e);
      }
    });
  }

  getEMRClusterId() {
    return this.event.responseElements.jobFlowId;
  }
};

export default AutotagEMRWorker;
