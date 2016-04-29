import AutotagDefaultWorker from './autotag_default_worker';
import AWS from 'aws-sdk';
import co from 'co';

class AutotagS3Worker extends AutotagDefaultWorker {
  constructor(event) {
    super(event);
  }
  /* tagResource
  ** method: tagResource
  **
  ** Tag the S3 bucket with the relevant information
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let credentials = yield _this.assumeRole();
      _this.s3 = new AWS.S3({
        region: _this.event.awsRegion,
        credentials: credentials
      });
      let tags = yield _this.getExistingTags();
      tags.push(_this.getAutotagPair());
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

  setTags(tags) {
    let _this = this;
    return new Promise((resolve, reject) => {
      try {
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
