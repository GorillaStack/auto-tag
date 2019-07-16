import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';


class AutotagELBWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Add tag to elastic load balancer V1 & V2
  */

  async tagResource() {
    let roleName = this.roleName;
    let credentials = await this.assumeRole(roleName);
    if (this.isLoadBalancerV2()) {
      this.elbv2 = new AWS.ELBv2({
        region: this.event.awsRegion,
        credentials: credentials
      });
      await this.tagELBV2Resource();
    } else {
      this.elb = new AWS.ELB({
        region: this.event.awsRegion,
        credentials: credentials
      });
      await this.tagELBResource();
    }
  }

  tagELBResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let loadBalancerName = _this.getLoadBalancerName();
        let tags = _this.getAutotagTags();
        _this.logTags(loadBalancerName, tags, _this.constructor.name);
        _this.elb.addTags({
          LoadBalancerNames: [
            loadBalancerName
          ],
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

  tagELBV2Resource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let loadBalancerARN = _this.getLoadBalancerARN();
        let tags = _this.getAutotagTags();
        _this.logTags(loadBalancerARN, tags, _this.constructor.name);
        _this.elbv2.addTags({
          ResourceArns: [
            loadBalancerARN
          ],
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

  isLoadBalancerV2() {
    return (!!this.event.responseElements.loadBalancers && this.event.responseElements.loadBalancers[0] && this.event.responseElements.loadBalancers[0].loadBalancerArn);
  }

  getLoadBalancerARN() {
    return this.event.responseElements.loadBalancers[0].loadBalancerArn;
  }

  getLoadBalancerName() {
    return this.event.requestParameters.loadBalancerName;
  }

}

export default AutotagELBWorker;
