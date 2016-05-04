import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';
import _ from 'underscore';

class AutotagDataPipelineWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag DataPipeline and associated resources
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
      _this.dataPipeline = new AWS.DataPipeline({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagDataPipelineResource();
    });
  }

  tagDataPipelineResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.dataPipeline.addTags({
          pipelineId: _this.getDataPipelineId(),
          tags: [
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

  getDataPipelineId() {
    return this.event.responseElements.pipelineId;
  }

  getAutotagPair() {
    let pair = {};
    _.each(super.getAutotagPair(), function(val, key) {
      pair[key.toLowerCase()] = val;
    });

    return pair;
  }
};

export default AutotagDataPipelineWorker;
