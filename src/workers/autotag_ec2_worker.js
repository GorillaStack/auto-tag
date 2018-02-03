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
        resourceIds.push(instance.InstanceId);
        resourceIds = resourceIds.concat(_this.getVolumeIds(instance));
        resourceIds = resourceIds.concat(_this.getEniIds(instance));
        if (_this.isInvokedByAutoscaling() || _this.isInvokedByOpsworks()) {
          if (parentTags.Tags && (Object.keys(parentTags.Tags).length > 0 || parentTags.Tags.length > 0)) {
            yield _this.tagEC2Resources(resourceIds, parentTags);
          } else {
            console.log('Error: Parent Tags not found or empty!');
            yield _this.tagEC2Resources(resourceIds);
          }
        } else {
          yield _this.tagEC2Resources(resourceIds);
        }
      }
    });
  }

  tagEC2Resources(resources, parentTags = {Tags: []}) {
    let _this = this;
    return new Promise((resolve, reject) => {
      let tags = _this.getEC2Tags(parentTags);
      _this.logTags(resources, tags, _this.constructor.name);
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

  getAutoscalingGroupTags(autoScalingGroupName, retries = 9) {
    let _this = this;
    let retryInterval = 5000;
    let delay = (time) => (result) => new Promise(resolve => setTimeout(() => resolve(result), time));
    return new Promise((resolve, reject) => {
      try {
        _this.autoscaling.describeTags({
          Filters: [{
            Name: 'auto-scaling-group',
            Values: [autoScalingGroupName]
          }, {
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
    // sometimes the event for the instances is delivered before the auto-scaling group,
    // added some retries to wait for the creator tag to exist before giving up
    // and tagging the instance with the root arn
    }).then(function (res) {
      if (_this.autoscalingAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries)) {
        console.log(_this.getCreatorTagName() + ' tag on parent AutoScaling group not found, retrying in ' + (retryInterval/1000) + ' secs...');
        return new Promise((resolve) => resolve(res)).then(delay(retryInterval)).then(result => {return result});
      } else {
        return res;
      }
    }).then(function (res) {
      if (_this.autoscalingAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries)) {
        return _this.getAutoscalingGroupTags(autoScalingGroupName, retries - 1);
      } else {
        return res
      }
    }, function (err) {
      return err;
    });
  }

  autoscalingAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries) {
    return (!(res.Tags && res.Tags.find(tag => tag.Key === this.getCreatorTagName())) && retries > 0)
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

  getOpsworksStackTags(opsworksStackId, retries = 9) {
    let _this = this;
    let retryInterval = 5000;
    let delay = (time) => (result) => new Promise(resolve => setTimeout(() => resolve(result), time));
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
    // sometimes the event for the instances is delivered before the opsworks stack,
    // added some retries to wait for the creator tag to exist before giving up
    // and tagging the instance with the opsworks service role
    }).then(function (res) {
      if (_this.opsworksAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries)) {
        console.log(_this.getCreatorTagName() + ' tag on parent OpsWorks stack not found, retrying in ' + (retryInterval/1000) + ' secs...');
        return new Promise((resolve) => resolve(res)).then(delay(retryInterval)).then(result => {return result});
      } else {
        return res;
      }
    }).then(function (res) {
      if (_this.opsworksAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries)) {
        return _this.getOpsworksStackTags(opsworksStackId, retries - 1);
      } else {
        return res
      }
    }, function (err) {
      return err;
    });
  }

  opsworksAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries) {
    return (!(res.Tags && res.Tags[this.getCreatorTagName()]) && retries > 0)
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
      if (_this.isInvokedByAutoscaling() && parentTags.Tags.find(tag => tag.Key === _this.getCreatorTagName())) {
        tags.forEach(function (tag) {
          if (tag.Key === _this.getCreatorTagName()) {
            tag.Value = parentTags.Tags[0].Value;
          }
        });
      // instances created by OpsWorks are always invoked by the opsworks service role
      // so we'll use the OpsWorks stack's creator value
      } else if (_this.isInvokedByOpsworks() && parentTags.Tags[_this.getCreatorTagName()]) {
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
