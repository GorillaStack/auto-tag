import 'babel-polyfill';
import zlib from 'zlib';
import AWS from 'aws-sdk';
import co from 'co';
import _ from 'underscore';
import constants from './cloud_trail_event_config';
import AutotagFactory from './autotag_factory';

class AwsCloudTrailListener {
  constructor(cloudtrailEvent, applicationContext, enabledServices) {
    this.cloudtrailEvent = cloudtrailEvent;
    this.applicationContext = applicationContext;
    this.enabledServices = enabledServices;
    this.s3 = new AWS.S3();
    this.s3Region = '';
    this.autotagActions = [];
  }

  execute() {
    let _this = this;
    return co(function* () {
      let logFiles = yield _this.retrieveLogFileDetails();
      yield _this.collectAndPerformAutotagActionsFromLogFile(logFiles);
    })

    .then(() => {
      _this.applicationContext.succeed();
    }, (e) => {
      _this.handleError(e);
    })

    .catch((e) => {
      _this.handleError(e);
    });
  }

  handleError(err) {
    console.log(err);
    console.log(err.stack);
    this.applicationContext.fail(err);
  }

  retrieveLogFileDetails() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        this.s3Region = _this.cloudtrailEvent.Records[0].awsRegion;
        let logFiles = _this.cloudtrailEvent.Records.map(event => {
          return { Bucket: event.s3.bucket.name, Key: event.s3.object.key };
        });
        resolve(logFiles);
      } catch (e) {
        reject(e);
      }
    });
  }

  collectAndPerformAutotagActionsFromLogFile(logFiles) {
    let _this = this;
    return co(function* () {
      for (let i in logFiles) {
        let log = yield _this.retrieveAndUnGzipLog(logFiles[i]);
        for (let j in log.Records) {
          let event = log.Records[j];
          let worker = AutotagFactory.createWorker(event, _this.enabledServices, _this.s3Region);
          yield worker.tagResource();
        }
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
    return new Promise((resolve, reject) => {
      _this.s3.getObject(logFile, (err, res) => {
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
    return new Promise((resolve, reject) => {
      zlib.gunzip(zippedContent, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(result.toString()));
        }
      });
    });
  }
};

const dumpRecord = (event) => {
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

_.each(constants, function(value, key) {
  AwsCloudTrailListener[key] = value;
});

export default AwsCloudTrailListener;
