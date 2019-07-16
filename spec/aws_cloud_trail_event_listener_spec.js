// import AwsCloudTrailEventListener from '../src/aws_cloud_trail_event_listener';

// describe('AwsCloudTrailEventListener', () => {
//   const applicationContext = {
//     succeed: () => {},
//     fail: () => {}
//   };

//   const cloudtrailObject = {
//     Records: [
//       {
//         Sns: {
//           Message: {
//           }
//         }
//       }
//     ]
//   };

  // describe('execute', () => {
  //   it('should retrieve a list of objects with the bucket name and bucket fileKey', done => {
  //     const listener = new AwsCloudTrailEventListener(cloudtrailObject, applicationContext);
  //     listener.retrieveLogFileDetails().then(
  //       result => {
  //         expect(result).toEqual([
  //           { Bucket: 'bucket1', Key: 'fileKey1.json.gz' },
  //         ]);
  //         done();
  //       },
  //       err => {
  //         expect(err).toBe(undefined);
  //         done();
  //       }

  //     );
  //   });
  // });
// });
