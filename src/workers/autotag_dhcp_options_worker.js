import { EC2 } from "@aws-sdk/client-ec2";
import AutotagEC2Worker from './autotag_ec2_worker.js';

class AutotagDhcpOptionsWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created DhcpOptions
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.ec2 = new EC2({
      region: this.event.awsRegion,
      credentials
    });
    await this.tagEC2Resources([this.getDhcpOptionsId()]);
  }

  getDhcpOptionsId() {
    return this.event.responseElements.dhcpOptions.dhcpOptionsId;
  }
}

export default AutotagDhcpOptionsWorker;
