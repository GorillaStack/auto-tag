import AWS from 'aws-sdk';
import AutotagDefaultWorker from './autotag_default_worker';

class AutotagCloudwatchLogGroupWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created Log Group
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.cloudwatchLogs = new AWS.CloudWatchLogs({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagLogGroupResource();
  }

  tagLogGroupResource() {
    return new Promise((resolve, reject) => {
      try {
        const logGroupName = this.getLogGroupName();
        const tags = this.getFunctionTags(this.getAutotagTags());
        this.logTags(logGroupName, tags, this.constructor.name);
        this.cloudwatchLogs.tagLogGroup({
          logGroupName,
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

  getFunctionTags(tags) {
    const newTags = {};
    tags.forEach(tag => {
      newTags[tag.Key] = tag.Value;
    });
    return newTags;
  }

  getLogGroupName() {
    return this.event.requestParameters.logGroupName;
  }
}

export default AutotagCloudwatchLogGroupWorker;
