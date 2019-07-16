import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import _ from 'underscore';

class AutotagDataPipelineWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag DataPipeline and associated resources
  */

  async tagResource() {
    let roleName = this.roleName;
    let credentials = await this.assumeRole(roleName);
    this.dataPipeline = new AWS.DataPipeline({
      region: this.event.awsRegion,
      credentials: credentials
    });
    await this.tagDataPipelineResource();
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
}

export default AutotagDataPipelineWorker;
