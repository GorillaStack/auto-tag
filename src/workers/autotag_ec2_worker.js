import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';

class AutotagEC2Worker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag the ec2 instance
  */

  async tagResource() {
    let roleName = this.roleName;
    let credentials = await this.assumeRole(roleName);
    let parentTags, opsworksInstances;

    this.ec2 = new AWS.EC2({
      region: this.event.awsRegion,
      credentials: credentials
    });

    if (this.isInvokedByAutoscaling()) {
      this.autoscaling = new AWS.AutoScaling({
        region: this.event.awsRegion,
        credentials: credentials
      });
      const autoscalingInstances = await this.getAutoscalingInstances();
      const autoscalingGroupName = autoscalingInstances.AutoScalingInstances[0].AutoScalingGroupName;
      parentTags = await this.getAutoscalingGroupTags(autoscalingGroupName);
    }

    if (this.isInvokedByOpsworks()) {
      this.opsworks = new AWS.OpsWorks({
        region: this.event.awsRegion,
        credentials: credentials
      });
      try {
        opsworksInstances = await this.getOpsworksInstances();
      } catch(err) {
        if (err.name === 'ResourceNotFoundException') {
          // switch to the main OpsWorks region and try again
          this.opsworks = new AWS.OpsWorks({
            region: 'us-east-1',
            credentials: credentials
          });
          opsworksInstances = await this.getOpsworksInstances();
        } else {
          throw(err);
        }
      }
      const opsworksStackId = opsworksInstances.Instances[0].StackId;
      parentTags = await this.getOpsworksStackTags(opsworksStackId);
    }

    const instances = await this.getEC2Instances();
    for (let instance of instances.Reservations[0].Instances) {
      let resourceIds = [];
      resourceIds.push(instance.InstanceId);
      resourceIds = resourceIds.concat(this.getVolumeIds(instance));
      resourceIds = resourceIds.concat(this.getEniIds(instance));
      if (this.isInvokedByAutoscaling() || this.isInvokedByOpsworks()) {
        if (parentTags.Tags && (Object.keys(parentTags.Tags).length > 0 || parentTags.Tags.length > 0)) {
          await this.tagEC2Resources(resourceIds, parentTags);
        } else {
          console.log('Error: Parent Tags not found or empty!');
          await this.tagEC2Resources(resourceIds);
        }
      } else {
        await this.tagEC2Resources(resourceIds);
      }
    }
  }

  tagEC2Resources(resources, parentTags = {Tags: []}) {
    return new Promise((resolve, reject) => {
      let tags = this.getEC2Tags(parentTags);
      this.logTags(resources, tags, this.constructor.name);
      try {
        this.ec2.createTags({
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
    return new Promise((resolve, reject) => {
      let instanceIds = this.getInstanceIds(this.getInstances());
      try {
        this.ec2.describeInstances({
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
    return new Promise((resolve, reject) => {
      const instanceIds = this.getInstanceIds(this.getInstances());
      try {
        this.autoscaling.describeAutoScalingInstances({
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
    let retryInterval = 5000;
    let delay = (time) => (result) => new Promise(resolve => setTimeout(() => resolve(result), time));
    return new Promise((resolve, reject) => {
      try {
        this.autoscaling.describeTags({
          Filters: [{
            Name: 'auto-scaling-group',
            Values: [autoScalingGroupName]
          }, {
            Name: 'key',
            Values: [this.getCreatorTagName()]
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
      if (this.autoscalingAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries)) {
        console.log(this.getCreatorTagName() + ' tag on parent AutoScaling group not found, retrying in ' + (retryInterval/1000) + ' secs...');
        return new Promise((resolve) => resolve(res)).then(delay(retryInterval)).then(result => {return result});
      } else {
        return res;
      }
    }).then(function (res) {
      if (this.autoscalingAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries)) {
        return this.getAutoscalingGroupTags(autoScalingGroupName, retries - 1);
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
    return new Promise((resolve, reject) => {
      let instanceIds = this.getOpsworksInstanceIds(this.getInstances());
      try {
        this.opsworks.describeInstances({
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
    let retryInterval = 5000;
    let delay = (time) => (result) => new Promise(resolve => setTimeout(() => resolve(result), time));
    return new Promise((resolve, reject) => {
      try {
        this.opsworks.listTags({
          ResourceArn: this.getOpsworksStackArn(opsworksStackId)
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
    }).then(res => {
      if (this.opsworksAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries)) {
        console.log(this.getCreatorTagName() + ' tag on parent OpsWorks stack not found, retrying in ' + (retryInterval/1000) + ' secs...');
        return new Promise((resolve) => resolve(res)).then(delay(retryInterval)).then(result => {return result});
      } else {
        return res;
      }
    }).then(res => {
      if (this.opsworksAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries)) {
        return this.getOpsworksStackTags(opsworksStackId, retries - 1);
      } else {
        return res
      }
    }, err => err);
  }

  opsworksAutoTagCreatorTagNotExistsAndRetriesLeft(res, retries) {
    return (!(res.Tags && res.Tags[this.getCreatorTagName()]) && retries > 0)
  }

  getInstances() {
    return this.event.responseElements.instancesSet.items;
  }

  getInstanceIds(instances) {
    return instances.map(instance => instance.instanceId);
  }

  getOpsworksInstanceIds(instances) {
    return instances.map(instance => instance.clientToken);
  }

  getVolumeIds(instance) {
    return instance.BlockDeviceMappings.map(mapping => mapping.Ebs.VolumeId);
  }

  getEniIds(instance) {
    return instance.NetworkInterfaces.map(ni => ni.NetworkInterfaceId);
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
    let tags = this.getAutotagTags();
    if (this.getEventName() === 'RunInstances') {
      // instances created by auto-scaling are always invoked by the root user
      // so we'll use the auto-scaling group's creator value.
      if (this.isInvokedByAutoscaling() && parentTags.Tags.find(tag => tag.Key === this.getCreatorTagName())) {
        tags.forEach(function (tag) {
          if (tag.Key === this.getCreatorTagName()) {
            tag.Value = parentTags.Tags[0].Value;
          }
        });
      // instances created by OpsWorks are always invoked by the opsworks service role
      // so we'll use the OpsWorks stack's creator value
      } else if (this.isInvokedByOpsworks() && parentTags.Tags[this.getCreatorTagName()]) {
        tags.forEach(function (tag) {
          if (tag.Key === this.getCreatorTagName()) {
            tag.Value = parentTags.Tags[this.getCreatorTagName()];
          }
        });
      }
    }
  return tags;
  }
}

export default AutotagEC2Worker;
