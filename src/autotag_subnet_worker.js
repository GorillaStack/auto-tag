const AutotagDefaultWorker = require('./autotag_default_worker');
const AWS = require('aws-sdk');

class AutotagSubnetWorker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
    this.ec2 = new AWS.EC2({region: event.awsRegion});

  }
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created VPC
  */

  tagResource() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        _this.ec2.createTags({
          Resources: [
            _this.getSubnetId()
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

  getSubnetId() {
    return this.event.responseElements.subnet.subnetId;
  }
};

export default AutotagSubnetWorker;
