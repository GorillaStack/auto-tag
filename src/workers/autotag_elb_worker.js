import { ElasticLoadBalancing as ELB } from "@aws-sdk/client-elastic-load-balancing";
import { ElasticLoadBalancingV2 as ELBv2 } from "@aws-sdk/client-elastic-load-balancing-v2";
import AutotagDefaultWorker from './autotag_default_worker.js';

class AutotagELBWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Add tag to elastic load balancer V1 & V2
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    if (this.isLoadBalancerV2()) {
      this.elbv2 = new ELBv2({
        region: this.event.awsRegion,
        credentials
      });
      await this.tagELBV2Resource();
    } else {
      this.elb = new ELB({
        region: this.event.awsRegion,
        credentials
      });
      await this.tagELBResource();
    }
  }

  tagELBResource() {
    return new Promise((resolve, reject) => {
      try {
        const loadBalancerName = this.getLoadBalancerName();
        const tags = this.getAutotagTags();
        this.logTags(loadBalancerName, tags, this.constructor.name);
        this.elb.addTags({
          LoadBalancerNames: [
            loadBalancerName
          ],
          Tags: tags
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

  tagELBV2Resource() {
    return new Promise((resolve, reject) => {
      try {
        const loadBalancerARN = this.getLoadBalancerARN();
        const tags = this.getAutotagTags();
        this.logTags(loadBalancerARN, tags, this.constructor.name);
        this.elbv2.addTags({
          ResourceArns: [
            loadBalancerARN
          ],
          Tags: tags
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

  isLoadBalancerV2() {
    return !!this.event.responseElements.loadBalancers
      && this.event.responseElements.loadBalancers[0]
      && this.event.responseElements.loadBalancers[0].loadBalancerArn;
  }

  getLoadBalancerARN() {
    return this.event.responseElements.loadBalancers[0].loadBalancerArn;
  }

  getLoadBalancerName() {
    return this.event.requestParameters.loadBalancerName;
  }
}

export default AutotagELBWorker;
