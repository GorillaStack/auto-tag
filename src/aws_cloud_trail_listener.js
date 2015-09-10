require('babel/polyfill');
const fs = require('fs');
const lib = require('zlib');
const AWS = require('aws-sdk');
const co = require('co');

class AwsCloudTrailListener {
  constructor(cloudtrailEvent, applicationContext) {
    this.cloudtrailEvent = cloudtrailEvent;
    this.applicationContext = applicationContext;
    this.records = [];
  };

  execute() {
    let _this = this;
    return co(function* () {
      let logFiles = yield _this.retrieveLogFileDetails();
      yield _this.collectAutotagActions(logFiles);
      //yield _this.performAutotagActions();
    }).then(function() {
      _this.applicationContext.succeed();
    }).catch(function() {
      _this.handleError();
    });
  }

  handleError(err) {
    this.applicationContext.fail(JSON.stringify(err));
  }

  retrieveLogFileDetails() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        let logFiles = _this.cloudtrailEvent.Records.map((event) => {
          return {bucket: event.s3.bucket.name, fileKey: event.s3.object.key};
        });
        resolve(logFiles);
      } catch (e) {
        reject(e);
      }
    });
  }

  collectAutotagActions(logFiles) {
    let _this = this;
    return new Promise(function(resolve, reject) {
      console.log(logFiles);
      // let logFiles = _this.cloudtrailEvent.map((event) => {
      //   return {bucket: event.s3.bucket.name, fileKey: event.s3.object.key};
      // });
      resolve();
    });
  }
}


var dumpRecord = function(event) {
  console.log('Event Name: ' + event.eventName);
  console.log('Event Type: ' + event.eventType);
  console.log('Event Source: ' + event.eventSource);
  console.log('AWS Region: ' + event.awsRegion);
  console.log('User Identity:');
  console.log(event.userIdentity);
  console.log('Request Parameters:');
  console.log(event.requestParameters);
  console.log('Response Elements:');
  console.log(event.requestParameters);
  console.log('s3:');
  console.log(event.s3);
};

export default AwsCloudTrailListener;
