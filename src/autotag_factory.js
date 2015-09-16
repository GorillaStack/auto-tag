const AutotagDefaultWorker = require('./autotag_default_worker.js');
const AutotagEC2Worker = require('./autotag_ec2_worker.js');
const AutotagS3Worker = require('./autotag_s3_worker.js');

let AutotagFactory = {

  createWorker: function(event, enabledServices) {

    // Default: worker that does nothing
    return new AutotagDefaultWorker(event);
  }

};

export default AutotagFactory;
