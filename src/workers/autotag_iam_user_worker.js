import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';
import _ from 'underscore';

class AutotagIAMUserWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created IAM User
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = _this.roleName;
      let credentials = yield _this.assumeRole(roleName);
      _this.iam = new AWS.IAM({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagIamUserResource();
    });
  }

  tagIamUserResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let userName = _this.getUserName();
        let tags = _this.getAutotagTags();
        _this.logTags(userName, tags, _this.constructor.name);
        _this.iam.tagUser({
          UserName: userName,
          Tags: tags
        }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  getUserName() {
    return this.event.responseElements.user.userName;
  }
};

export default AutotagIAMUserWorker;
