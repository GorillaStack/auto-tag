import AWS from 'aws-sdk';
import AutotagDefaultWorker from './autotag_default_worker';

class AutotagDataPipelineWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag DataPipeline and associated resources
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.dataPipeline = new AWS.DataPipeline({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagDataPipelineResource();
  }

  tagDataPipelineResource() {
    return new Promise((resolve, reject) => {
      try {
        const dataPipelineId = this.getDataPipelineId();
        const tags = this.getAutotagTags();
        this.logTags(dataPipelineId, tags, this.constructor.name);
        this.dataPipeline.addTags({
          pipelineId: dataPipelineId,
          tags
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

  getDataPipelineId() {
    return this.event.responseElements.pipelineId;
  }

  // datapipeline will only accept lower case key names
  getAutotagTags() {
    const tags = [];
    super.getAutotagTags().forEach(val => {
      const tag = {
        key: val.Key,
        value: val.Value
      };
      tags.push(tag);
    });
    return tags;
  }
}

export default AutotagDataPipelineWorker;
