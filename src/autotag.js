import AwsCloudTrailListener from './aws_cloud_trail_listener';

export function handler(cloudtrailEvent, context) {
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

  let listener = new AwsCloudTrailListener(cloudtrailEvent, context, enabledListeners);
  return listener.execute();

  // context.succeed();  // Echo back the first key value
  // context.fail('Something went wrong');
};
