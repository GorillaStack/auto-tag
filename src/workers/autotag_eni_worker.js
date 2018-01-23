import AutotagEC2Worker from './autotag_ec2_worker';
import AWS from 'aws-sdk';
import co from 'co';

class AutotagENIWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created ENI
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
      _this.ec2 = new AWS.EC2({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      yield _this.tagEC2Resources([_this.getNetworkInterfaceId()]);
    });
  }

  getNetworkInterfaceId() {
    return this.event.responseElements.networkInterface.networkInterfaceId;
  }
};

export default AutotagENIWorker;
