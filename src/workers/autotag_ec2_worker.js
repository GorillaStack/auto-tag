import AutotagDefaultWorker from './autotag_default_worker';
import AWS  from 'aws-sdk';
import co from 'co';

class AutotagEC2Worker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
  }

  /* tagResource
  ** method: tagResource
  **
  ** Tag the ec2 instance
  */
  tagResource() {
    let _this = this;
    return co(function* () {
      let credentials = yield _this.assumeRole();
      _this.ec2 = new AWS.EC2({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagEC2Resources([_this.getInstanceId()]);
    });
  }

  tagEC2Resources(resources) {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.ec2.createTags({
          Resources: resources,
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

  getInstanceId() {
    return this.event.responseElements.instancesSet.items[0].instanceId;
  }
};

export default AutotagEC2Worker;
