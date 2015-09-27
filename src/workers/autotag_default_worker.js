const AUTOTAG_TAG_NAME = 'AutoTag_Creator';

class AutotagDefaultWorker {
  constructor(event) {
    this.event = event;
  }

  /* tagResource
  ** method: tagResource
  **
  ** Do nothing
  */
  tagResource() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        // Do nothing
        resolve(true);
      } catch(e) {
        reject(e);
      }
    });
  }

  dumpEventInfo() {
    console.log('Event Name: ' + this.event.eventName);
    console.log('Event Type: ' + this.event.eventType);
    console.log('Event Source: ' + this.event.eventSource);
    console.log('AWS Region: ' + this.event.awsRegion);
    console.log('---');
  }

  getAutotagPair() {
    return {
      Key: this.getTagName(),
      Value: this.getTagValue()
    };
  }

  getTagName() {
    return AUTOTAG_TAG_NAME;
  }

  getTagValue() {
    return this.event.userIdentity.arn;
  }
};

export default AutotagDefaultWorker;
