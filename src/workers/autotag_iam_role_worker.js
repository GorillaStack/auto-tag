import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';
import _ from 'underscore';

class AutotagIAMRoleWorker extends AutotagDefaultWorker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created IAM Role
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
      yield _this.tagIamRoleResource();
    });
  }

  tagIamRoleResource() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let roleName = _this.getRoleName();
        let tags = _this.getAutotagTags();
        _this.logTags(roleName, tags, _this.constructor.name);
        _this.iam.tagRole({
          RoleName: roleName,
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

  getRoleName() {
    return this.event.responseElements.role.roleName;
  }
};

export default AutotagIAMRoleWorker;
