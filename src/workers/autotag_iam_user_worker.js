import { IAM } from "@aws-sdk/client-iam";
import AutotagDefaultWorker from './autotag_default_worker.js';

class AutotagIAMUserWorker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created IAM User
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.iam = new IAM({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagIamUserResource();
  }

  tagIamUserResource() {
    return new Promise((resolve, reject) => {
      try {
        const userName = this.getUserName();
        const tags = this.getAutotagTags();
        this.logTags(userName, tags, this.constructor.name);
        this.iam.tagUser({
          UserName: userName,
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

  getUserName() {
    return this.event.responseElements.user.userName;
  }
}

export default AutotagIAMUserWorker;
