const AutotagDefaultWorker = require('./autotag_default_worker');
const AWS = require('aws-sdk');
const co = require('co');

class AutotagS3Worker extends AutotagDefaultWorker {

  constructor(event) {
    super(event);
    this.s3 = new AWS.S3({region: event.awsRegion});
  }
  /* tagResource
  ** method: tagResource
  **
  ** Tag the S3 bucket with the relevant information
  */

  tagResource() {
    let _this = this;
    return co(function* () {
      let tags = yield _this.getExistingTags();
      tags.push(_this.getAutotagPair());
      yield _this.setTags(tags);
    });
  }

  getExistingTags() {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        _this.s3.getBucketTagging({
          Bucket: _this.getBucketName(),
        }, function(err, res) {
          if (err) {
            if (err.code === 'NoSuchTagSet' && err.statusCode === 404)
              resolve([]);
            else
              reject(err);
          } else {
            resolve(res.TagSet);
          }
        })
      } catch(e) {
        reject(e);
      }
    });
  }

  setTags(tags) {
    let _this = this;
    return new Promise(function(resolve, reject) {
      try {
        _this.s3.putBucketTagging({
          Bucket: _this.getBucketName(),
          Tagging: {
            TagSet: tags
          }
        }, function(err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        })
      } catch(e) {
        reject(e);
      }
    });
  }

  getBucketName() {
    return this.event.requestParameters.bucketName;
  }
};

export default AutotagS3Worker;
