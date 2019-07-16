import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';

import _ from "underscore";

class AutotagOpsworksWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Add tag to OpsWorks stack
  */

  async tagResource() {
    let roleName = this.roleName;
    let credentials = await this.assumeRole(roleName);
    this.opsworks = new AWS.OpsWorks({
      region: this.event.awsRegion,
      credentials: credentials
    });
    let opsworksStacks = await this.getOpsworksStacks();
    let opsworksStackArn = this.getOpsworksStackArn(opsworksStacks);
    await this.tagOpsworksStack(opsworksStackArn);
  }

  tagOpsworksStack(opsworksStackArn) {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let tagConfig = _this.getOpsworksTags(_this.getAutotagTags());
        _this.logTags(opsworksStackArn, tagConfig, _this.constructor.name);
        _this.opsworks.tagResource({
          ResourceArn: opsworksStackArn,
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

  getOpsworksStackArn(opsworksStacks) {
    let opsworksStack = _.where(opsworksStacks.Stacks, {Name: this.event.requestParameters.name});
    let stackCount = opsworksStack.length;
    if (stackCount === 1) {
      return opsworksStack[0].Arn;
    } else {
      throw('Error: Found (' + stackCount + ') OpsWorks Stacks when searching by name.');
    }
  }

  getOpsworksStacks() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.opsworks.describeStacks({
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
    let _this = this;
    let tags = {};
    tagConfig.forEach (function(tag) {
      // exclude the 'create time' and the 'invoked by' tags
      // otherwise OpsWorks will propagate it to the instances
      if (![_this.getCreateTimeTagName(), _this.getInvokedByTagName()].includes(tag.Key)) {
        tags[tag.Key] = tag.Value;
      }
    });
    return tags;
  }

}

export default AutotagOpsworksWorker;
