import AWS from 'aws-sdk';
import AutotagDefaultWorker, { AUTOTAG_TAG_NAME_PREFIX } from './autotag_default_worker';

const TAG_NAME_PREFIXES_TO_FILTER = [
  'aws:'
];

const AUTOTAG_TAG_PREFIX = 'at_';

class AutotagS3Worker extends AutotagDefaultWorker {
  /* tagResource
  ** method: tagResource
  **
  ** Tag the S3 bucket with the relevant information
  */

  async tagResource() {
    const roleName = this.roleName;
    const credentials = await this.assumeRole(roleName);
    this.s3 = new AWS.S3({
      region: this.event.awsRegion,
      credentials
    });
    let tags = await this.getExistingTags();
    // remove anything starting with the prefix before we add our tags to make this idempotent
    tags = tags.filter(tag => (!tag.Key.startsWith(AUTOTAG_TAG_NAME_PREFIX)));
    tags = tags.concat(this.getAutotagTags());
    tags = this.touchReservedTagKeys(tags);
    await this.setTags(tags);
  }

  getExistingTags() {
    return new Promise((resolve, reject) => {
      try {
        this.s3.getBucketTagging({
          Bucket: this.getBucketName(),
        }, (err, res) => {
          if (err) {
            if (err.code === 'NoSuchTagSet' && err.statusCode === 404) {
              resolve([]);
            } else {
              reject(err);
            }
          } else {
            resolve(res.TagSet);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
  * touchReservedTagKeys
  *
  * S3 requires us to set all bucket tags at once using a call to 'putBucketTagging'
  * AWS does not allow us to set tags with certain namespaces, including those
  * created by CloudFormation. Therefore we need to touch these to support
  * cases where the S3 bucket was created by CloudFormation.
  */
  touchReservedTagKeys(tags) {
    return tags.map(tag => {
      if (this.tagKeyIsReserved(tag)) {
        return Object.assign({}, tag, {
          Key: AUTOTAG_TAG_PREFIX + tag.Key,
        });
      }

      return tag;
    });
  }

  /**
  * tagKeyIsReserved
  *
  * check if tag key is reserved
  */
  tagKeyIsReserved(tag) {
    return TAG_NAME_PREFIXES_TO_FILTER.some(prefix => tag.Key.startsWith(prefix));
  }

  setTags(tags) {
    return new Promise((resolve, reject) => {
      try {
        const bucketName = this.getBucketName();
        this.logTags(bucketName, tags, this.constructor.name);
        this.s3.putBucketTagging({
          Bucket: this.getBucketName(),
          Tagging: {
            TagSet: tags
          }
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
    });
  }

  getBucketName() {
    return this.event.requestParameters.bucketName;
  }
}

export default AutotagS3Worker;
