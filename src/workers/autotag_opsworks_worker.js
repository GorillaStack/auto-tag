import AWS from 'aws-sdk';
import AutotagDefaultWorker from './autotag_default_worker';

class AutotagOpsworksWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Add tag to OpsWorks stack
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.opsworks = new AWS.OpsWorks({
      region: this.event.awsRegion,
      credentials
    });
    const opsworksStacks = await this.getOpsworksStacks();
    const opsworksStackArn = this.getOpsworksStackArn(opsworksStacks);
    await this.tagOpsworksStack(opsworksStackArn);
  }

  tagOpsworksStack(opsworksStackArn) {
    return new Promise((resolve, reject) => {
      try {
        const tagConfig = this.getOpsworksTags(this.getAutotagTags());
        this.logTags(opsworksStackArn, tagConfig, this.constructor.name);
        this.opsworks.tagResource({
          ResourceArn: opsworksStackArn,
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

  getOpsworksStackArn(opsworksStacks) {
    const opsworksStack = opsworksStacks.Stacks.find(stack => stack.Name === this.event.requestParameters.name);
    if (opsworksStack) {
      return opsworksStack.Arn;
    } else {
      throw Error(`Error: No OpsWorks Stacks found when searching for '${this.event.requestParameters.name}' by name.`);
    }
  }

  getOpsworksStacks() {
    return new Promise((resolve, reject) => {
      try {
        this.opsworks.describeStacks({
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

  getOpsworksTags(tagConfig) {
    const tags = {};
    tagConfig.forEach(tag => {
      // exclude the 'create time' and the 'invoked by' tags
      // otherwise OpsWorks will propagate it to the instances
      if (![this.getCreateTimeTagName(), this.getInvokedByTagName()].includes(tag.Key)) {
        tags[tag.Key] = tag.Value;
      }
    });
    return tags;
  }
}

export default AutotagOpsworksWorker;
