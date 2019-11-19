import AwsCloudTrailLogListener from './aws_cloud_trail_log_listener';

if (!global._babelPolyfill) {
  require('babel-polyfill'); // eslint-disable-line global-require
}

export const handler = async (cloudtrailEvent, context) => {
  const enabledListeners = [
    AwsCloudTrailLogListener.EC2.name,
    AwsCloudTrailLogListener.S3.name,
    AwsCloudTrailLogListener.AUTOSCALE_GROUPS.name,
    AwsCloudTrailLogListener.VPC.name,
    AwsCloudTrailLogListener.SUBNETS.name,
    AwsCloudTrailLogListener.ELB.name,
    AwsCloudTrailLogListener.EBS.name,
    AwsCloudTrailLogListener.INTERNET_GATEWAY.name,
    AwsCloudTrailLogListener.RDS.name,
    AwsCloudTrailLogListener.EMR.name,
    AwsCloudTrailLogListener.DATA_PIPELINE.name,
    AwsCloudTrailLogListener.SECURITY_GROUP.name,
    AwsCloudTrailLogListener.AMI_CREATE.name,
    AwsCloudTrailLogListener.AMI_COPY.name,
    AwsCloudTrailLogListener.AMI_REGISTER.name,
    AwsCloudTrailLogListener.SNAPSHOT_CREATE.name,
    AwsCloudTrailLogListener.SNAPSHOT_COPY.name,
    AwsCloudTrailLogListener.SNAPSHOT_IMPORT.name,
    AwsCloudTrailLogListener.ELASTIC_IP.name,
    AwsCloudTrailLogListener.DYNAMO_DB.name,
    AwsCloudTrailLogListener.ENI.name,
    AwsCloudTrailLogListener.NAT_GATEWAY.name,
    AwsCloudTrailLogListener.NETWORK_ACL.name,
    AwsCloudTrailLogListener.ROUTE_TABLE.name,
    AwsCloudTrailLogListener.VPC_PEERING.name,
    AwsCloudTrailLogListener.VPN_CONNECTION.name,
    AwsCloudTrailLogListener.VPN_GATEWAY.name,
    AwsCloudTrailLogListener.OPS_WORKS.name,
    AwsCloudTrailLogListener.OPS_WORKS_CLONE.name,
    AwsCloudTrailLogListener.IAM_USER.name,
    AwsCloudTrailLogListener.IAM_ROLE.name,
    AwsCloudTrailLogListener.CUSTOMER_GATEWAY.name,
    AwsCloudTrailLogListener.DHCP_OPTIONS.name,
    AwsCloudTrailLogListener.LAMBDA_FUNCTION_2015.name,
    AwsCloudTrailLogListener.LAMBDA_FUNCTION_2014.name,
    AwsCloudTrailLogListener.CLOUDWATCH_ALARM.name,
    AwsCloudTrailLogListener.CLOUDWATCH_EVENTS_RULE.name,
    AwsCloudTrailLogListener.CLOUDWATCH_LOG_GROUP.name

  ];

  const listener = new AwsCloudTrailLogListener(cloudtrailEvent, context, enabledListeners);
  await listener.execute();
};

export default handler;
