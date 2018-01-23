import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';

class AutotagELBWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Add tag to elastic load balancer V1 & V2
  */
  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
      if (_this.isLoadBalancerV2()) {
        _this.elbv2 = new AWS.ELBv2({
          region: _this.event.awsRegion,
          credentials: credentials
        });
        yield _this.tagELBV2Resource();
      } else {
        _this.elb = new AWS.ELB({
          region: _this.event.awsRegion,
          credentials: credentials
        });
        yield _this.tagELBResource();
      }
    });
  }

  tagELBResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let loadBalancerName = _this.getLoadBalancerName();
        let tags = _this.getAutotagTags();
        _this.logTags(loadBalancerName, tags);
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
        _this.logTags(loadBalancerARN, tags);
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
    return (!!this.event.responseElements.loadBalancers && this.event.responseElements.loadBalancers[0].loadBalancerArn);
  }

  getLoadBalancerARN() {
    return this.event.responseElements.loadBalancers[0].loadBalancerArn;
  }

  getLoadBalancerName() {
    return this.event.requestParameters.loadBalancerName;
  }

};

export default AutotagELBWorker;
