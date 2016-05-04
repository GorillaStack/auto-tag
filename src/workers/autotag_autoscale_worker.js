import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from  'co';

class AutotagAutoscaleWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Add tag to autoscaling groups
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
      _this.autoscaling = new AWS.AutoScaling({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagAutoscalingGroup();
    });
  }

  tagAutoscalingGroup() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let tagConfig = _this.getAutotagPair();
        tagConfig.ResourceId = _this.getAutoscalingGroupName();
        tagConfig.ResourceType = 'auto-scaling-group';
        tagConfig.PropagateAtLaunch = true;
        _this.autoscaling.createOrUpdateTags({
          Tags: [
            tagConfig
          ]
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
};

export default AutotagAutoscaleWorker;
