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
    AwsCloudTrailListener.DATA_PIPELINE.name,
    AwsCloudTrailListener.SECURITY_GROUP.name,
    AwsCloudTrailListener.AMI.name,
    AwsCloudTrailListener.SNAPSHOT.name,
    AwsCloudTrailListener.ELASTIC_IP.name,
    AwsCloudTrailListener.DYNAMO_DB.name,
    AwsCloudTrailListener.ENI.name,
    AwsCloudTrailListener.NAT_GATEWAY.name,
    AwsCloudTrailListener.NETWORK_ACL.name,
    AwsCloudTrailListener.ROUTE_TABLE.name,
    AwsCloudTrailListener.VPC_PEERING.name,
    AwsCloudTrailListener.VPN.name,
    AwsCloudTrailListener.OPS_WORKS.name
    
  ];

  let listener = new AwsCloudTrailListener(cloudtrailEvent, context, enabledListeners);
  return listener.execute();

};
