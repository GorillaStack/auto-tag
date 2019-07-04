import AwsCloudTrailLogListener from './aws_cloud_trail_log_listener';
import AwsCloudTrailEventListener from "./aws_cloud_trail_event_listener";

export function handler(cloudtrailEvent, context) {
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
    AwsCloudTrailLogListener.AMI_IMPORT.name,
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
    AwsCloudTrailLogListener.VPN.name,
    AwsCloudTrailLogListener.OPS_WORKS.name,
    AwsCloudTrailLogListener.OPS_WORKS_CLONE.name,
    AwsCloudTrailEventListener.IAM_USER.name,
    AwsCloudTrailEventListener.IAM_ROLE.name
  ];

  let listener = new AwsCloudTrailLogListener(cloudtrailEvent, context, enabledListeners);
  return listener.execute();

};
