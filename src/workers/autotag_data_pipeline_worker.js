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
    let dataPipelineId = _this.getDataPipelineId();
    let tags = _this.getAutotagTags();
    _this.logTags(dataPipelineId, tags, _this.constructor.name);
    _this.dataPipeline.addTags({
          pipelineId: dataPipelineId,
          tags: tags
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

  // datapipeline will only accept lower case key names
  getAutotagTags() {
    let tags = [];
    _.each(super.getAutotagTags(), function(val) {
      let tag = {
        key: val.Key,
        value: val.Value
      };
      tags.push(tag);
    });
    return tags;
  }

};

export default AutotagDataPipelineWorker;
