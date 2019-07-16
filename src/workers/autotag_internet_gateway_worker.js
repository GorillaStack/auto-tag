import AutotagEC2Worker from './autotag_ec2_worker';
import AWS from 'aws-sdk';


class AutotagInternetGatewayWorker extends AutotagEC2Worker {

  /* tagResource
  ** method: tagResource
  **
  ** Autotag elastic block storage volumes that are created.
  */

  async tagResource() {
    let roleName = this.roleName;
    let credentials = await this.assumeRole(roleName);
    this.ec2 = new AWS.EC2({
      region: this.event.awsRegion,
      credentials: credentials
    });
    await this.tagEC2Resources([this.getInternetGatewayId()]);
  }

  getInternetGatewayId() {
    return this.event.responseElements.internetGateway.internetGatewayId;
  }
}

export default AutotagInternetGatewayWorker;
