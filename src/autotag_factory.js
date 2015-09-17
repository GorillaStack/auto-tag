const _ = require('underscore');
const AutotagDefaultWorker = require('./autotag_default_worker.js');
const AutotagEC2Worker = require('./autotag_ec2_worker.js');
const AutotagS3Worker = require('./autotag_s3_worker.js');
const CONFIG = require('./cloud_trail_event_config');

let AutotagFactory = {

  createWorker: function(event, enabledServices) {
    // Match Service
    let matchingService = _.findWhere(CONFIG, {targetEventName: event.eventName});

    // Check service found and service enabled
    if (_.isUndefined(matchingService)
      || !_.contains(enabledServices, matchingService.name)) {
      // Default: worker that does nothing
      return new AutotagDefaultWorker(event);
    }

    // Select the relevant worker
    switch (matchingService.name) {
      case CONFIG.EC2.name:
        console.log('matched EC2 worker');
        return new AutotagEC2Worker(event);
        break;

      case CONFIG.S3.name:
        console.log('matched S3 worker');
        return new AutotagS3Worker(event);
        break;

      default:
        // Default: worker that does nothing
        return new AutotagDefaultWorker(event);

    }

  }

};

export default AutotagFactory;
