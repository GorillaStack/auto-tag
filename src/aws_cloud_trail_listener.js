require('babel/polyfill');
const zlib = require('zlib');
const AWS = require('aws-sdk');
const co = require('co');
const _ = require('underscore');

class AwsCloudTrailListener {
  constructor(cloudtrailEvent, applicationContext) {
    this.cloudtrailEvent = cloudtrailEvent;
    this.applicationContext = applicationContext;
    this.s3 = new AWS.S3();
    this.autotagActions = [];
  }

  execute() {
    let _this = this;
    return co(function* () {
      let logFiles = yield _this.retrieveLogFileDetails();
      yield _this.collectAutotagActions(logFiles);
      //yield _this.performAutotagActions();
    }).then(function() {
      _this.applicationContext.succeed();
    }).catch(function(e) {
      _this.handleError(e);
    });
  }

  handleError(err) {
    this.applicationContext.fail(err);
  }

  retrieveLogFileDetails() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        let logFiles = _this.cloudtrailEvent.Records.map((event) => {
          return {Bucket: event.s3.bucket.name, Key: event.s3.object.key};
        });
        resolve(logFiles);
      } catch (e) {
        reject(e);
      }
    });
  }

  performAutotagActions() {

  }

  collectAutotagActions(logFiles) {
    let _this = this;
    return co(function* () {
      for (let i in logFiles) {
        let log = yield _this.retrieveAndUnGzipLog(logFiles[i]);
        _.each(log.Records, function(event) {
          dumpRecord(event);
        });
      }
    });
  }

  retrieveAndUnGzipLog(logFile) {
    let _this = this;
    return co(function* () {
      let gzippedContent = yield _this.retrieveFromS3(logFile);
      let rawContent = yield _this.unGzipContent(gzippedContent);
      return rawContent;
    });
  }

  retrieveFromS3(logFile) {
    let _this = this;
    return new Promise(function(resolve, reject) {
      _this.s3.getObject(logFile, function(err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res.Body);
        }
      });
    });
  }

  unGzipContent(zippedContent) {
    let _this = this;
    return new Promise(function(resolve, reject) {
      zlib.gunzip(zippedContent, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(result.toString()));
        }
      });
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
