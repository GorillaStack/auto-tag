import AWS from 'aws-sdk';
import AutotagEC2Worker from './autotag_ec2_worker.js';

class AutotagVPNConnectionWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created VpnConnection
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.ec2 = new AWS.EC2({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagEC2Resources([this.getVpnConnectionId()]);
  }

  getVpnConnectionId() {
    return this.event.responseElements.vpnConnection.vpnConnectionId;
  }
}

export default AutotagVPNConnectionWorker;
