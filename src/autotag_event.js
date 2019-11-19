import AwsCloudTrailEventListener from './aws_cloud_trail_event_listener';

if (!global._babelPolyfill) {
  require('babel-polyfill'); // eslint-disable-line global-require
}

export const handler = async (cloudtrailEvent, context) => {
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
    AwsCloudTrailEventListener.AMI_CREATE.name,
    AwsCloudTrailEventListener.AMI_COPY.name,
    AwsCloudTrailEventListener.AMI_REGISTER.name,
    AwsCloudTrailEventListener.SNAPSHOT_CREATE.name,
    AwsCloudTrailEventListener.SNAPSHOT_COPY.name,
    AwsCloudTrailEventListener.SNAPSHOT_IMPORT.name,
    AwsCloudTrailEventListener.ELASTIC_IP.name,
    AwsCloudTrailEventListener.DYNAMO_DB.name,
    AwsCloudTrailEventListener.ENI.name,
    AwsCloudTrailEventListener.NAT_GATEWAY.name,
    AwsCloudTrailEventListener.NETWORK_ACL.name,
    AwsCloudTrailEventListener.ROUTE_TABLE.name,
    AwsCloudTrailEventListener.VPC_PEERING.name,
    AwsCloudTrailEventListener.VPN_CONNECTION.name,
    AwsCloudTrailEventListener.VPN_GATEWAY.name,
    AwsCloudTrailEventListener.OPS_WORKS.name,
    AwsCloudTrailEventListener.OPS_WORKS_CLONE.name,
    AwsCloudTrailEventListener.IAM_USER.name,
    AwsCloudTrailEventListener.IAM_ROLE.name,
    AwsCloudTrailEventListener.CUSTOMER_GATEWAY.name,
    AwsCloudTrailEventListener.DHCP_OPTIONS.name,
    AwsCloudTrailEventListener.LAMBDA_FUNCTION_2015.name,
    AwsCloudTrailEventListener.LAMBDA_FUNCTION_2014.name,
    AwsCloudTrailEventListener.CLOUDWATCH_ALARM.name,
    AwsCloudTrailEventListener.CLOUDWATCH_EVENTS_RULE.name,
    AwsCloudTrailEventListener.CLOUDWATCH_LOG_GROUP.name
  ];

  const listener = new AwsCloudTrailEventListener(cloudtrailEvent, context, enabledListeners);
  await listener.execute();
};

export default handler;
