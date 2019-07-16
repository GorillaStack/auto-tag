import each from 'lodash/each';
import constants from './cloud_trail_event_config';
import AutotagFactory from './autotag_factory';
import SETTINGS from './autotag_settings';

class AwsCloudTrailEventListener {
  constructor(cloudtrailEvent, applicationContext, enabledServices) {
    if (cloudtrailEvent.Records) {
      this.cloudtrailEvent = JSON.parse(cloudtrailEvent.Records[0].Sns.Message);
    } else {
      this.cloudtrailEvent = cloudtrailEvent;
    }
    this.applicationContext = applicationContext;
    this.enabledServices = enabledServices;
  }

  async execute() {
    try {
      const event = this.cloudtrailEvent.detail;
      // inject this field into the cloudwatch rule event to make it uniform with the S3 file event
      // this field was the only field that was moved from the "detail" sub-hash up into the top level
      event.recipientAccountId = this.cloudtrailEvent.account;
      if (!event.errorCode && !event.errorMessage) {
        const worker = AutotagFactory.createWorker(event, this.enabledServices, this.cloudtrailEvent.region);
        await worker.tagResource();
        this.logDebug();
      } else {
        this.logEventError(event);
      }

      this.applicationContext.succeed();
    } catch (e) {
      this.handleError(e);
    }
  }

  handleError(err) {
    if (SETTINGS.DebugLoggingOnFailure) {
      console.log(`CloudTrail Event - Failed: ${JSON.stringify(this.cloudtrailEvent, null, 2)}`);
    }
    console.log(err);
    console.log(err.stack);
    this.applicationContext.fail(err);
  }

  logDebug() {
    if (SETTINGS.DebugLogging) {
      console.log(`CloudTrail Event - Debug: ${JSON.stringify(this.cloudtrailEvent, null, 2)}`);
    }
  }

  logEventError(event) {
    if (event.errorCode) {
      console.log(`CloudTrail Event - Error Code: ${event.errorCode}`);
    }
    if (event.errorMessage) {
      console.log(`CloudTrail Event - Error Message: ${event.errorMessage}`);
    }
  }
}

each(constants, (value, key) => {
  AwsCloudTrailEventListener[key] = value;
});

export default AwsCloudTrailEventListener;
