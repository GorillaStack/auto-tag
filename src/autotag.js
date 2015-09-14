var AwsCloudTrailListener = require('./aws_cloud_trail_listener');
var exports = {};
exports.handler = function(cloudtrailEvent, context) {
  let listener = new AwsCloudTrailListener(cloudtrailEvent, context);
  return listener.execute();

  // context.succeed();  // Echo back the first key value
  // context.fail('Something went wrong');
};

export default exports;
