const AwsCloudTrailListener = require('./aws_cloud_trail_listener');
const exports = {};
exports.handler = function(cloudtrailEvent, context) {
  let enabledListeners = [
    AwsCloudTrailListener.EC2.name,
    AwsCloudTrailListener.S3.name,
    AwsCloudTrailListener.AUTOSCALE_GROUPS.name,
    AwsCloudTrailListener.VPC.name,
    AwsCloudTrailListener.SUBNETS.name,
    AwsCloudTrailListener.ELB.name,
    AwsCloudTrailListener.EBS.name,
    AwsCloudTrailListener.INTERNET_GATEWAY.name,
    AwsCloudTrailListener.RDS.name
  ];

  let listener = new AwsCloudTrailListener(cloudtrailEvent, context, enabledListeners);
  return listener.execute();

  // context.succeed();  // Echo back the first key value
  // context.fail('Something went wrong');
};

export default exports;
