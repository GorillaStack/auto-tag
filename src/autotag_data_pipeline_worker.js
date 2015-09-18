const AutotagDefaultWorker = require('./autotag_default_worker');
const AWS = require('aws-sdk');
const _ = require('underscore');

class AutotagDataPipelineWorker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
    this.dataPipeline = new AWS.DataPipeline({region: event.awsRegion});
  }

  /* tagResource
  ** method: tagResource
  **
  ** Tag DataPipeline and associated resources
  */

  tagResource() {
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
