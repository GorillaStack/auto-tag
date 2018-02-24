import AutotagEC2Worker from './autotag_ec2_worker';
import AWS from 'aws-sdk';
import co from 'co';

class AutotagSecurityGroupWorker extends AutotagEC2Worker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created Security Group
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = _this.roleName;
      let credentials = yield _this.assumeRole(roleName);
      _this.ec2 = new AWS.EC2({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagEC2Resources([_this.getSecurityGroupId()]);
    });
  }

  getSecurityGroupId() {
    return this.event.responseElements.groupId;
  }
};

export default AutotagSecurityGroupWorker;
