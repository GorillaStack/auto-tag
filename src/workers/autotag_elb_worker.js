const AutotagDefaultWorker = require('./autotag_default_worker');
const AWS = require('aws-sdk');
const co = require('co');

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
    return new Promise(function(resolve, reject) {
      try {
        _this.elb.addTags({
          LoadBalancerNames: [
            _this.getLoadBalancerName()
          ],
          Tags: [
            _this.getAutotagPair()
          ]
        }, function(err, res) {
          if (err)
            reject(err);
          else
            resolve(true);
        });
      } catch(e) {
        reject(e);
      }
    });
  }

  getLoadBalancerName() {
    return this.event.requestParameters.loadBalancerName;
  }
};

export default AutotagELBWorker;
