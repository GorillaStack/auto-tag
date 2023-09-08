import AWS from 'aws-sdk';
import AutotagDefaultWorker from './autotag_default_worker.js';

class AutotagCloudwatchEventsRuleWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created Events Rule
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.cloudwatchEvents = new AWS.CloudWatchEvents({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagRuleResource();
  }

  tagRuleResource() {
    return new Promise((resolve, reject) => {
      try {
        const ruleArn = this.getRuleArn();
        const tags = this.getAutotagTags();
        this.logTags(ruleArn, tags, this.constructor.name);
        this.cloudwatchEvents.tagResource({
          ResourceARN: ruleArn,
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

  getRuleArn() {
    return this.event.responseElements.ruleArn;
  }
}

export default AutotagCloudwatchEventsRuleWorker;
