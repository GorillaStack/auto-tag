const AwsCloudTrailListener = require('./aws_cloud_trail_listener');
const exports = {};

exports.handler = function(cloudtrailEvent, context) {
  const enabledListeners = [
    AwsCloudTrailListener.EC2.name,
    AwsCloudTrailListener.S3.name,
    AwsCloudTrailListener.AUTOSCALE_GROUPS.name,
    AwsCloudTrailListener.VPC.name,
    AwsCloudTrailListener.SUBNETS.name,
    AwsCloudTrailListener.ELB.name,
    AwsCloudTrailListener.EBS.name,
    AwsCloudTrailListener.INTERNET_GATEWAY.name,
    AwsCloudTrailListener.RDS.name,
    AwsCloudTrailListener.EMR.name,
    AwsCloudTrailListener.DATA_PIPELINE.name
  ];

  /*
  ** An object where:
  ** Keys: linked account ids
  ** Values: the arn of the role configured for cross account access on that
  ** account
  */
  const rolesForCrossAccountAccess = {
    '002': 'arn'
  };
  let listener = new AwsCloudTrailListener(cloudtrailEvent, context, enabledListeners);
  return listener.execute();

  // context.succeed();  // Echo back the first key value
  // context.fail('Something went wrong');
};

export default exports;
