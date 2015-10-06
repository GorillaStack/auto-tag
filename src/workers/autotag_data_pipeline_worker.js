const AutotagDefaultWorker = require('./autotag_default_worker');
const AWS = require('aws-sdk');
const co = require('co');
const _ = require('underscore');

class AutotagDataPipelineWorker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
  }

  /* tagResource
  ** method: tagResource
  **
  ** Tag DataPipeline and associated resources
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let credentials = yield _this.assumeRole();
      _this.dataPipeline = new AWS.DataPipeline({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagDataPipelineResource();
    });
  }

  tagDataPipelineResource() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        _this.dataPipeline.addTags({
          pipelineId: _this.getDataPipelineId(),
          tags: [
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
