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
      let parentTags, opsworksInstances;

      _this.ec2 = new AWS.EC2({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      
      if (_this.isInvokedByAutoscaling()) {
        _this.autoscaling = new AWS.AutoScaling({
          region: _this.event.awsRegion,
          credentials: credentials
        });
        let autoscalingInstances = yield _this.getAutoscalingInstances();
        let autoscalingGroupName = autoscalingInstances.AutoScalingInstances[0].AutoScalingGroupName;
        parentTags = yield _this.getAutoscalingGroupTags(autoscalingGroupName);
      }

      if (_this.isInvokedByOpsworks()) {
        _this.opsworks = new AWS.OpsWorks({
          region: _this.event.awsRegion,
          credentials: credentials
        });
        try {
          opsworksInstances = yield _this.getOpsworksInstances();
        } catch(err) {
          if (err.name === 'ResourceNotFoundException') {
            // switch to the main OpsWorks region and try again
            _this.opsworks = new AWS.OpsWorks({
              region: 'us-east-1',
              credentials: credentials
            });
            opsworksInstances = yield _this.getOpsworksInstances();
          } else {
            throw err;
          }
        }
        let opsworksStackId = opsworksInstances.Instances[0].StackId;
        parentTags = yield _this.getOpsworksStackTags(opsworksStackId);
      }
      
      let instances = yield _this.getEC2Instances();
      for (let instance of instances.Reservations[0].Instances) {
        let resourceIds = [];
        resourceIds = resourceIds.concat(_this.getEniIds(instance));
        resourceIds = resourceIds.concat(_this.getVolumeIds(instance));
        resourceIds.push(instance.InstanceId);
        if (_this.isInvokedByAutoscaling() || _this.isInvokedByOpsworks()) {
          yield _this.tagEC2Resources(resourceIds, parentTags);
        } else {
          yield _this.tagEC2Resources(resourceIds);
        }
      }
    });
  }

  tagEC2Resources(resources, autoscalingTags = []) {
    let _this = this;
    return new Promise((resolve, reject) => {
      let tags = _this.getEC2Tags(autoscalingTags);
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

  getEC2Instances() {
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

  getOpsworksInstances() {
    let _this = this;
    return new Promise((resolve, reject) => {
      let instanceIds = _this.getOpsworksInstanceIds(_this.getInstances());
      try {
        _this.opsworks.describeInstances({
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

  getOpsworksStackTags(opsworksStackId) {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.opsworks.listTags({
          ResourceArn: _this.getOpsworksStackArn(opsworksStackId)
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

  getOpsworksInstanceIds(instances) {
    return _.map(instances, function(instance){ return instance.clientToken; });
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

  getEventName() {
    return this.event.eventName;
  }

  getOpsworksStackArn(opsworksStackId) {
    let arnComponents = ['arn', 'aws', 'opsworks'];
    arnComponents.push(this.event.awsRegion);
    arnComponents.push(this.getAccountId());
    arnComponents.push('stack/' + opsworksStackId + '/');
    return arnComponents.join(':');
  }

  isInvokedByAutoscaling() {
    return (this.getInvokedBy() === 'autoscaling.amazonaws.com');
  }

  isInvokedByOpsworks() {
    return (this.getInvokedBy() === 'opsworks.amazonaws.com');
  }

  getEC2Tags(parentTags) {
    let _this = this;
    let tags = _this.getAutotagTags();
    if (_this.getEventName() === 'RunInstances') {
      // instances created by auto-scaling are always invoked by the root user
      // so we'll use the auto-scaling group's creator value.
      if (_this.isInvokedByAutoscaling() && parentTags.Tags.length > 0) {
        tags.forEach(function (tag) {
          if (tag.Key === _this.getCreatorTagName()) {
            tag.Value = parentTags.Tags[0].Value;
          }
        });
      // instances created by OpsWorks are always invoked by the opsworks service role
      // so we'll use the OpsWorks stack's creator value
      } else if (_this.isInvokedByOpsworks() && Object.keys(parentTags.Tags).length > 0) {
        tags.forEach(function (tag) {
          if (tag.Key === _this.getCreatorTagName()) {
            tag.Value = parentTags.Tags[_this.getCreatorTagName()];
          }
        });
      }
    }
  return tags;
  }
};

export default AutotagEC2Worker;
