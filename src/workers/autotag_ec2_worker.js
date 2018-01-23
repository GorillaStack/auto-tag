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
      let instances = yield _this.getEC2DescribeInstances();
      for (let instance of instances.Reservations[0].Instances) {
    let resourceIds = [];
    resourceIds = resourceIds.concat(_this.getEniIds(instance));
    resourceIds = resourceIds.concat(_this.getVolumeIds(instance));
    resourceIds.push(instance.InstanceId);
    let resourceIdsNoCreateTimeTag = []; // _this.getVolumeIds(instance);
    yield _this.tagEC2Resources(resourceIds);
    if (resourceIdsNoCreateTimeTag.length > 0) {
      yield _this.tagEC2Resources(resourceIdsNoCreateTimeTag, false);
    }
      }
    });
  }

  tagEC2Resources(resources, createTimeFlag = true) {
    let _this = this;
    return new Promise((resolve, reject) => {
      if (createTimeFlag) {
        _this.tags = _this.getEC2Tags([_this.getAutotagCreateTimeTag()]);
      } else {
        _this.tags = _this.getEC2Tags([]);
      }
      _this.logTags(resources, _this.tags);
      try {
        _this.ec2.createTags({
          Resources: resources,
          Tags: _this.tags
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

  getEC2Tags(tags) {
    let _this = this;
    let invokedBy = _this.getInvokedBy();
    // instances created by auto-scaling are always invoked by the root user
    // so we won't tag those with a creator, the auto-scaling group worker
    // will take care of them.
    if (invokedBy !== 'autoscaling.amazonaws.com') {
      tags.push(_this.getAutotagCreatorTag());
    }
    return tags;
  }
};

export default AutotagEC2Worker;
