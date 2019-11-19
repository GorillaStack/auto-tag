import AWS from 'aws-sdk';
import AutotagDefaultWorker from './autotag_default_worker';

class AutotagLambdaFunctionWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created Lambda Function
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.lambda = new AWS.Lambda({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagFunctionResource();
  }

  tagFunctionResource() {
    return new Promise((resolve, reject) => {
      try {
        const functionArn = this.getFunctionArn();
        const tags = this.getFunctionTags(this.getAutotagTags());
        this.logTags(functionArn, tags, this.constructor.name);
        this.lambda.tagResource({
          Resource: functionArn,
          Tags: tags
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

  getFunctionTags(tags) {
    const newTags = {};
    tags.forEach(tag => {
      newTags[tag.Key] = tag.Value;
    });
    return newTags;
  }

  getFunctionArn() {
    return this.event.responseElements.functionArn;
  }
}

export default AutotagLambdaFunctionWorker;
