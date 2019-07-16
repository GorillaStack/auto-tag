import AutotagEC2Worker from './autotag_ec2_worker';
import AWS from 'aws-sdk';


class AutotagNATGatewayWorker extends AutotagEC2Worker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created NatGateway
  */

  async tagResource() {
    let roleName = this.roleName;
    let credentials = await this.assumeRole(roleName);
    this.ec2 = new AWS.EC2({
      region: this.event.awsRegion,
      credentials: credentials
    });
    await this.tagEC2Resources([this.getNatGatewayId()]);
  }

  getNatGatewayId() {
    return this.event.responseElements.CreateNatGatewayResponse.natGateway.natGatewayId;
  }
}

export default AutotagNATGatewayWorker;
