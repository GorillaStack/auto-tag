import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';
import _ from 'underscore';

class AutotagEC2Worker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag the ec2 instance
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
      _this.ec2 = new AWS.EC2({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      if (_this.isInvokedByAutoScaling()) {
        _this.autoscaling = new AWS.AutoScaling({
          region: _this.event.awsRegion,
          credentials: credentials
        });

        let autoscalingInstances = yield _this.getAutoscalingInstances();
        let autoscalingGroupName = autoscalingInstances.AutoScalingInstances[0].AutoScalingGroupName;
        var autoscalingTags = yield _this.getAutoscalingGroupTags(autoscalingGroupName);
      }
      let instances = yield _this.getEC2DescribeInstances();
      for (let instance of instances.Reservations[0].Instances) {
        let resourceIds = [];
        resourceIds = resourceIds.concat(_this.getEniIds(instance));
        resourceIds = resourceIds.concat(_this.getVolumeIds(instance));
        resourceIds.push(instance.InstanceId);
        if (_this.isInvokedByAutoScaling()) {
          yield _this.tagEC2Resources(resourceIds, autoscalingTags);
        } else {
          yield _this.tagEC2Resources(resourceIds);
        }
      }
    });
  }

  tagEC2Resources(resources, autoscalingTags = []) {
    let _this = this;
    return new Promise((resolve, reject) => {
      let tags = _this.getEC2Tags([_this.getAutotagCreateTimeTag()], autoscalingTags);
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

  getEC2DescribeInstances() {
    let _this = this;
    return new Promise((resolve, reject) => {
      let instanceIds = _this.getInstanceIds(_this.getInstances());
      try {
        _this.ec2.describeInstances({
          InstanceIds: instanceIds
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

  getAutoscalingInstances() {
    let _this = this;
    return new Promise((resolve, reject) => {
      let instanceIds = _this.getInstanceIds(_this.getInstances());
      try {
        _this.autoscaling.describeAutoScalingInstances({
          InstanceIds: instanceIds
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

  getAutoscalingGroupTags(autoScalingGroupName) {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.autoscaling.describeTags({
          Filters: [{
            Name: 'auto-scaling-group',
            Values: [autoScalingGroupName]
          },{
            Name: 'key',
            Values: [_this.getCreatorTagName()]
          }]
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

  getInstances() {
    return this.event.responseElements.instancesSet.items;
  }

  getInstanceIds(instances) {
    return _.map(instances, function(instance){ return instance.instanceId; });
  }

  getVolumeIds(instance) {
    return _.map(instance.BlockDeviceMappings, function(blockDeviceMapping){ return blockDeviceMapping.Ebs.VolumeId; });
  }

  getEniIds(instance) {
    return _.map(instance.NetworkInterfaces, function(networkInterface){ return networkInterface.NetworkInterfaceId; });
  }

  getInvokedBy() {
    return this.event.userIdentity.invokedBy;
  }

  isInvokedByAutoScaling() {
    return (this.getInvokedBy() === 'autoscaling.amazonaws.com');
  }

  getEC2Tags(tags, autoscalingTags = false) {
    let _this = this;
    // instances created by auto-scaling are always invoked by the root user
    // so we'll check the auto-scaling group for the creator and tag with that.
    if (_this.isInvokedByAutoScaling() && autoscalingTags) {
      if (autoscalingTags.Tags && autoscalingTags.Tags.length > 0) {
        tags.push(_this.getAutotagCreatorTag(autoscalingTags.Tags[0].Value));
      }
    } else {
      tags.push(_this.getAutotagCreatorTag());
    }
    return tags;
  }
};

export default AutotagEC2Worker;
