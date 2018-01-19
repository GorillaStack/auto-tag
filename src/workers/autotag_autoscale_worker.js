import AutotagDefaultWorker from './autotag_default_worker';
//import AutotagEC2Worker from './autotag_ec2_worker';
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
      //let credentials = new AWS.SharedIniFileCredentials({profile: 'development-sysops'});
      _this.autoscaling = new AWS.AutoScaling({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      _this.ec2 = new AWS.EC2({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      let autoScalingGroup = yield _this.getExistingAutoscalingGroup();
      let autoScalingInstances = _this.getAutoscalingInstances(autoScalingGroup);
      yield _this.tagAutoscalingGroup();
      if (autoScalingInstances.length > 0) {
        yield _this.tagAutoscalingEC2Resources(autoScalingInstances);
      }
    });
  }

  tagAutoscalingGroup() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let tagConfig = _this.getAutoscalingTags(_this.getAutotagTags());
        _this.logTags(_this.getAutoscalingGroupName(), tagConfig);
        _this.autoscaling.createOrUpdateTags({
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

  // tag any existing auto-scaling instances
  tagAutoscalingEC2Resources(resources) {
    let _this = this;
    return new Promise((resolve, reject) => {
      // we only want to tag the creator here
      // let the ec2 instance worker tag anything else
      let tags = [_this.getAutotagCreatorTag()];
      _this.logTags(resources, tags);
      try {
        _this.ec2.createTags({
          Resources: resources,
          Tags: tags
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
  
  getExistingAutoscalingGroup() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.autoscaling.describeAutoScalingGroups({
          AutoScalingGroupNames: [_this.getAutoscalingGroupName()],
        }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
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

  getAutoscalingInstances(autoScalingGroups) {
    return autoScalingGroups.AutoScalingGroups[0].Instances.map(function (item) {
      return item.InstanceId;
    });
  }

  getAutoscalingTags(tagConfig) {
    let _this = this;
    tagConfig.forEach (function(tag) {
      tag.ResourceId = _this.getAutoscalingGroupName();
      tag.ResourceType = 'auto-scaling-group';
      // Only propagate the creator the ASG to the instances
      tag.PropagateAtLaunch = tag['Key'] == _this.getCreatorTagName();
    });
    return tagConfig;
  }

};

export default AutotagAutoscaleWorker;
