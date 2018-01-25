import AwsCloudTrailEventListener from './aws_cloud_trail_event_listener';

export function handler(cloudtrailEvent, context) {
  const enabledListeners = [
    AwsCloudTrailEventListener.EC2.name,
    AwsCloudTrailEventListener.S3.name,
    AwsCloudTrailEventListener.AUTOSCALE_GROUPS.name,
    AwsCloudTrailEventListener.VPC.name,
    AwsCloudTrailEventListener.SUBNETS.name,
    AwsCloudTrailEventListener.ELB.name,
    AwsCloudTrailEventListener.EBS.name,
    AwsCloudTrailEventListener.INTERNET_GATEWAY.name,
    AwsCloudTrailEventListener.RDS.name,
    AwsCloudTrailEventListener.EMR.name,
    AwsCloudTrailEventListener.DATA_PIPELINE.name,
    AwsCloudTrailEventListener.SECURITY_GROUP.name,
    AwsCloudTrailEventListener.AMI.name,
    AwsCloudTrailEventListener.SNAPSHOT.name,
    AwsCloudTrailEventListener.ELASTIC_IP.name,
    AwsCloudTrailEventListener.DYNAMO_DB.name,
    AwsCloudTrailEventListener.ENI.name,
    AwsCloudTrailEventListener.NAT_GATEWAY.name,
    AwsCloudTrailEventListener.NETWORK_ACL.name,
    AwsCloudTrailEventListener.ROUTE_TABLE.name,
    AwsCloudTrailEventListener.VPC_PEERING.name,
    AwsCloudTrailEventListener.VPN.name
  ];

  let listener = new AwsCloudTrailEventListener(cloudtrailEvent, context, enabledListeners);
  return listener.execute();

};
