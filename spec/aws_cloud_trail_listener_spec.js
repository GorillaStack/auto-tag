var sut = require('../lib/aws_cloud_trail_listener');

describe('AwsCloudTrailListener', function() {
  var applicationContext = {
    succeed: function() {},
    fail: function() {}
  };

  var cloudtrailObject = {
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
      var listener = new sut(cloudtrailObject, applicationContext);
      listener.retrieveLogFileDetails().then(
        function(result) {
          expect(result).toEqual([
            {bucket: 'bucket1', fileKey: 'fileKey1.json.gz'},
            {bucket: 'bucket2', fileKey: 'fileKey2.json.gz'}
          ]);
          done();
        },

        function(err) {
          expect(err).toBe(undefined);
          done();
        }

      );
    });
  });
});
