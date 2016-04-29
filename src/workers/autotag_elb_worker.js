import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';

class AutotagELBWorker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
  }

  /* tagResource
  ** method: tagResource
  **
  ** Add tag to elastic load balancer
  */
  tagResource() {
    let _this = this;
    return co(function* () {
      let credentials = yield _this.assumeRole();
      _this.elb = new AWS.ELB({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagELBResource();
    });
  }

  tagELBResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.elb.addTags({
          LoadBalancerNames: [
            _this.getLoadBalancerName()
          ],
          Tags: [
            _this.getAutotagPair()
          ]
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

  getLoadBalancerName() {
    return this.event.requestParameters.loadBalancerName;
  }
};

export default AutotagELBWorker;
