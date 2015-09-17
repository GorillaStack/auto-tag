const AutotagDefaultWorker = require('./autotag_default_worker');

class AutotagEC2Worker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Do nothing
  */

  tagResource() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        console.log('AutotagEC2Worker');
        _this.dumpEventInfo();
        // Do nothing
        resolve(true);
      } catch(e) {
        reject(e);
      }
    });
  }
};

export default AutotagEC2Worker;
