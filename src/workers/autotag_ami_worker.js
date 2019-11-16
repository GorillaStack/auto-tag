import AWS from 'aws-sdk';
import AutotagEC2Worker from './autotag_ec2_worker';

class AutotagAMIWorker extends AutotagEC2Worker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the newly created AMI and associated Snapshot
  */

  async tagResource() {
    const resourceIds = [];
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.ec2 = new AWS.EC2({
      region: this.event.awsRegion,
      credentials
    });

    resourceIds.push(this.getImageId());

    this.imageSnapshot = await this.getImageSnapshot();
    if(this.imageSnapshot) resourceIds.push(this.getImageSnapshotId());

    await this.tagEC2Resources(resourceIds);
  }

  getImageId() {
    return this.event.responseElements.imageId;
  }

  getImageSnapshot(retries = 9) {
    const retryInterval = 5000;
    const delay = time => result => new Promise(resolve => setTimeout(() => resolve(result), time));
    let imageSnapshotDescription;

    if(this.getEventName() === 'RegisterImage') {
      // the image was created from an existing snapshot so there is no new snapshot to tag
      return false;
    } else if(this.getEventName() === 'CopyImage') {
      imageSnapshotDescription = `Copied for DestinationAmi ${this.getImageId()}*`;
    } else if(this.getEventName() === 'CreateImage') {
      imageSnapshotDescription = `Created by CreateImage(*) for ${this.getImageId()}*`;
    } else {
      console.log(`Error: event name '${this.getEventName()}' not recognized, unable to tag associated snapshot`);
      return false;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ec2.describeSnapshots({
          Filters: [{
            Name: 'description',
            Values: [imageSnapshotDescription]
          }]
        }, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      } catch (e) {
        reject(e);
      }
    // retry logic in-case we need to wait a bit for the new snapshot to be available
    }).then(res => {
      if (this.imageSnapshotIdNotExistsAndRetriesLeft(res, retries)) {
        console.log(`${this.getImageId()} not found in any Snapshot descriptions, retrying in ${retryInterval / 1000} secs...`);
        return new Promise(resolve => resolve(res)).then(delay(retryInterval)).then(result => result);
      } else {
        return res;
      }
    }).then(res => {
      if (this.imageSnapshotIdNotExistsAndRetriesLeft(res, retries)) {
        return this.getImageSnapshot(retries - 1);
      } else {
        return res;
      }
    }, err => err);
  }

  imageSnapshotIdNotExistsAndRetriesLeft(res, retries) {
    return (!(res.Snapshots && res.Snapshots[0].SnapshotId) && retries > 0);
  }

  getImageSnapshotId() {
    return this.imageSnapshot.Snapshots[0].SnapshotId;
  }

  getEventName() {
    return this.event.eventName;
  }
}

export default AutotagAMIWorker;
