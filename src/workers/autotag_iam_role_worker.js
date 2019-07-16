import AWS from 'aws-sdk';
import AutotagDefaultWorker from './autotag_default_worker';

class AutotagIAMRoleWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created IAM Role
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.iam = new AWS.IAM({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagIamRoleResource();
  }

  tagIamRoleResource() {
    return new Promise((resolve, reject) => {
      try {
        const roleName = this.getRoleName();
        const tags = this.getAutotagTags();
        this.logTags(roleName, tags, this.constructor.name);
        this.iam.tagRole({
          RoleName: roleName,
          Tags: tags
        }, err => {
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
}

export default AutotagIAMRoleWorker;
