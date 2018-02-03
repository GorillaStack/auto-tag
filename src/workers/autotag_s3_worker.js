import AutotagDefaultWorker, {AUTOTAG_TAG_NAME_PREFIX} from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';

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

  tagResource() {
    let _this = this;
    return co(function* () {
      let roleName = yield _this.getRoleName();
      let credentials = yield _this.assumeRole(roleName);
      _this.s3 = new AWS.S3({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      let tags = yield _this.getExistingTags();
      // remove anything starting with the prefix before we add our tags to make this idempotent 
      tags = tags.filter( (tag) => (!tag.Key.startsWith(AUTOTAG_TAG_NAME_PREFIX)) );
      tags = tags.concat(_this.getAutotagTags());
      tags = _this.touchReservedTagKeys(tags);
      yield _this.setTags(tags);
    });
  }

  getExistingTags() {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.s3.getBucketTagging({
          Bucket: _this.getBucketName(),
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
    return tags.map((tag) => {
      if (this.tagKeyIsReserved(tag)) {
        tag.Key = AUTOTAG_TAG_PREFIX + tag.Key;
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
    return TAG_NAME_PREFIXES_TO_FILTER.some((prefix) => {
      return tag.Key.startsWith(prefix);
    });
  }

  setTags(tags) {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
        let bucketName = _this.getBucketName();
        _this.logTags(bucketName, tags, _this.constructor.name);
        _this.s3.putBucketTagging({
          Bucket: _this.getBucketName(),
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

};

export default AutotagS3Worker;
