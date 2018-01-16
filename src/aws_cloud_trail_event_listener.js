import 'babel-polyfill';
import AWS from 'aws-sdk';
import co from 'co';
import _ from 'underscore';
import constants from './cloud_trail_event_config';
import AutotagFactory from './autotag_factory';

class AwsCloudTrailEventListener {
  constructor(cloudtrailEvent, applicationContext, enabledServices) {
    if (cloudtrailEvent.Records) {
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
      if (!event.errorCode && !event.errorMessage) {
        let worker = AutotagFactory.createWorker(event, _this.enabledServices, _this.cloudtrailEvent.region);
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
    console.log("CloudTrail Event - Failed:");
    console.log(JSON.stringify(this.cloudtrailEvent, null, 2));
    console.log(err);
    console.log(err.stack);
    this.applicationContext.fail(err);
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
