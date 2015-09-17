const AutotagDefaultWorker = require('./autotag_default_worker');
const AWS = require('aws-sdk');

class AutotagAutoscaleWorker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
    this.autoscaling = new AWS.AutoScaling({region: event.awsRegion});
  }

  /* tagResource
  ** method: tagResource
  **
  ** Add tag to autoscaling groups
  */

  tagResource() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        let tagConfig = _this.getAutotagPair()
        tagConfig.ResourceId = _this.getAutoscalingGroupName();
        tagConfig.ResourceType = 'auto-scaling-group';
        tagConfig.PropagateAtLaunch = true;
        _this.autoscaling.createOrUpdateTags({
          Tags: [
            tagConfig
          ]
        }, function(err, res) {
          if (err)
            reject(err);
          else
            resolve(true);
        });
      } catch(e) {
        reject(e);
      }
    });
  }

  getAutoscalingGroupName() {
    return this.event.requestParameters.autoScalingGroupName;
  }
};

export default AutotagAutoscaleWorker;
