const AutotagDefaultWorker = require('./autotag_default_worker');

class AutotagEC2Worker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
  }

  /* tagResource
  ** method: tagResource
  **
  ** Do nothing
  ** return: true <- so that yielding does not complain about undefined
  */
  tagResource() {
    // Do nothing
    return true;
  }
};

export default AutotagDefaultWorker;
