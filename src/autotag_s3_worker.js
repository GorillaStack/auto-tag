const AutotagDefaultWorker = require('./autotag_default_worker');

class AutotagS3Worker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag the S3 bucket with the relevant information
  */

  tagResource() {
    let _this = this;
    console.log('called tagResource for s3');
    return new Promise(function(resolve, reject) {
      try {
        console.log('AutotagS3Worker');
        _this.dumpEventInfo();
        // Do nothing
        resolve(true);
      } catch(e) {
        reject(e);
      }
    });
  }
};

export default AutotagS3Worker;
