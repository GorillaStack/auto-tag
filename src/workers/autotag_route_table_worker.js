import AutotagEC2Worker from './autotag_ec2_worker';
import AWS from 'aws-sdk';


class AutotagRouteTableWorker extends AutotagEC2Worker {

  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created RouteTable
  */

  async tagResource() {
    let roleName = this.roleName;
    let credentials = await this.assumeRole(roleName);
    this.ec2 = new AWS.EC2({
      region: this.event.awsRegion,
      credentials: credentials
    });
    await this.tagEC2Resources([this.getRouteTableId()]);
  }

  getRouteTableId() {
    return this.event.responseElements.routeTable.routeTableId;
  }
}

export default AutotagRouteTableWorker;
