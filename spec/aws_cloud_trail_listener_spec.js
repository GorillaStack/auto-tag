import SutClass from '../lib/aws_cloud_trail_listener';

describe('AwsCloudTrailListener', () => {
  const applicationContext = {
    succeed: () => {},

    fail: () => {}
  };

  let cloudtrailObject = {
    Records: [
      {
        s3: {
          bucket: {
            name: 'bucket1'
          },
          object: {
            key: 'fileKey1.json.gz'
          }
        }
      },
      {
        s3: {
          bucket: {
            name: 'bucket2'
          },
          object: {
            key: 'fileKey2.json.gz'
          }
        }
      }
    ]
  };

  describe('retrieveLogFileDetails', function() {
    it('should retrieve a list of objects with the bucket name and bucket fileKey', function(done) {
      var listener = new SutClass(cloudtrailObject, applicationContext);
      listener.retrieveLogFileDetails().then(
        (result) => {
          expect(result).toEqual([
            { Bucket: 'bucket1', Key: 'fileKey1.json.gz' },
            { Bucket: 'bucket2', Key: 'fileKey2.json.gz' }
          ]);
          done();
        },

        (err) => {
          expect(err).toBe(undefined);
          done();
        }

      );
    });
  });
});
