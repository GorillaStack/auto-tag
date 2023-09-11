import { AutoScaling } from "@aws-sdk/client-auto-scaling";
import AutotagDefaultWorker from './autotag_default_worker.js';

class AutotagAutoscaleWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Add tag to autoscaling groups
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.autoscaling = new AutoScaling({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagAutoscalingGroup();
  }

  tagAutoscalingGroup() {
    return new Promise((resolve, reject) => {
      try {
        const tagConfig = this.getAutoscalingTags(this.getAutotagTags());
        this.logTags(this.getAutoscalingGroupName(), tagConfig, this.constructor.name);
        this.autoscaling.createOrUpdateTags({
          Tags: tagConfig
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

  getAutoscalingGroupName() {
    return this.event.requestParameters.autoScalingGroupName;
  }

  getAutoscalingTags(tagConfig) {
    return tagConfig.map(tag => Object.assign({}, tag, {
      ResourceId: this.getAutoscalingGroupName(),
      ResourceType: 'auto-scaling-group',
      PropagateAtLaunch: false,
    }));
  }
}

export default AutotagAutoscaleWorker;
