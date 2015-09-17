const AutotagDefaultWorker = require('./autotag_default_worker');
const AWS = require('aws-sdk');

class AutotagInternetGatewayWorker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
    this.ec2 = new AWS.EC2({region: event.awsRegion});

  }
  /* tagResource
  ** method: tagResource
  **
  ** Autotag elastic block storage volumes that are created.
  */

  tagResource() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      console.log('trying to tag internet gateway');
      try {
        _this.ec2.createTags({
          Resources: [
            _this.getInternetGatewayId()
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

  getInternetGatewayId() {
    return this.event.responseElements.internetGateway.internetGatewayId;
  }
};

export default AutotagInternetGatewayWorker;
