import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';

class AutotagAutoscaleWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Add tag to autoscaling groups
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.autoscaling = new AWS.AutoScaling({
      region: this.event.awsRegion,
      credentials: credentials
    });
    await this.tagAutoscalingGroup();
  }

  tagAutoscalingGroup() {
    return new Promise((resolve, reject) => {
      try {
        let tagConfig = this.getAutoscalingTags(this.getAutotagTags());
        this.logTags(this.getAutoscalingGroupName(), tagConfig, this.constructor.name);
        this.autoscaling.createOrUpdateTags({
          Tags: tagConfig
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

  getAutoscalingGroupName() {
    return this.event.requestParameters.autoScalingGroupName;
  }

  getAutoscalingTags(tagConfig) {
    tagConfig.forEach(tag => {
      tag.ResourceId = _this.getAutoscalingGroupName();
      tag.ResourceType = 'auto-scaling-group';
      tag.PropagateAtLaunch = false;
    });

    return tagConfig;
  }

};

export default AutotagAutoscaleWorker;
