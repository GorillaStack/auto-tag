import 'babel-polyfill';
import AWS from 'aws-sdk';
import co from 'co';
import _ from 'underscore';
import constants from './cloud_trail_event_config';
import AutotagFactory from './autotag_factory';
import SETTINGS from './autotag_settings.js';

class AwsCloudTrailEventListener {
  constructor(cloudtrailEvent, applicationContext, enabledServices) {
    if (cloudtrailEvent.Records) {
      // TODO: need to look into if there will _really_ always be ONE record?!
      this.cloudtrailEvent = JSON.parse(cloudtrailEvent.Records[0]['Sns']['Message']);
    } else {
      this.cloudtrailEvent = cloudtrailEvent;
    }
    this.applicationContext = applicationContext;
    this.enabledServices = enabledServices;
  }

  execute() {
    let _this = this;
    return co(function* () {
      let event = _this.cloudtrailEvent.detail;
      // inject this field into the event rule event to make it uniform with the S3 file event
      // this field was the only field that was moved from the "detail" sub-hash up into the top level
      event.recipientAccountId = _this.cloudtrailEvent.account;
      if (!event.errorCode && !event.errorMessage) {
        let worker = AutotagFactory.createWorker(event, _this.enabledServices, _this.cloudtrailEvent.region);
        if (worker.constructor.name !== 'AutotagDefaultWorker') { _this.logDebug() }
        yield worker.tagResource();
      } else {
        _this.logEventError(event);
      }
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
    if (SETTINGS.DebugLoggingOnFailure) {
      console.log("CloudTrail Event - Failed: " + JSON.stringify(this.cloudtrailEvent, null, 2));
    }
    console.log(err);
    console.log(err.stack);
    this.applicationContext.fail(err);
  }

  logDebug() {
    if (SETTINGS.DebugLogging) {
      console.log("CloudTrail Event - Debug: " + JSON.stringify(this.cloudtrailEvent, null, 2));
    }
  }

  logEventError(event) {
    if (event.errorCode) {
      console.log("CloudTrail Event - Error Code: " + event.errorCode);
    }
    if (event.errorMessage) {
      console.log("CloudTrail Event - Error Message: " + event.errorMessage);
    }
  }

};

_.each(constants, function(value, key) {
  AwsCloudTrailEventListener[key] = value;
});

export default AwsCloudTrailEventListener;
