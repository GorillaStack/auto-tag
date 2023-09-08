import AWS from 'aws-sdk';
import AutotagDefaultWorker from './autotag_default_worker.js';

class AutotagCloudwatchAlarmWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created CloudWatch Alarm
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.cloudwatch = new AWS.CloudWatch({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagAlarmResource();
  }

  tagAlarmResource() {
    return new Promise((resolve, reject) => {
      try {
        const alarmArn = this.getAlarmArn();
        const tags = this.getAutotagTags();
        this.logTags(alarmArn, tags, this.constructor.name);
        this.cloudwatch.tagResource({
          ResourceARN: alarmArn,
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

  getAlarmArn() {
    const arnComponents = ['arn', 'aws', 'cloudwatch'];
    arnComponents.push(this.event.awsRegion);
    arnComponents.push(this.getAccountId());
    arnComponents.push('alarm');
    arnComponents.push(this.event.requestParameters.alarmName);
    return arnComponents.join(':');
  }
}

export default AutotagCloudwatchAlarmWorker;
