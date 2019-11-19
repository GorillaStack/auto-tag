import find from 'lodash/find';
import values from 'lodash/values';
import AutotagDefaultWorker from './workers/autotag_default_worker';
import AutotagEC2Worker from './workers/autotag_ec2_worker';
import AutotagS3Worker from './workers/autotag_s3_worker';
import AutotagELBWorker from './workers/autotag_elb_worker';
import AutotagEBSWorker from './workers/autotag_ebs_worker';
import AutotagAutoscaleWorker from './workers/autotag_autoscale_worker';
import AutotagVPCWorker from './workers/autotag_vpc_worker';
import AutotagSubnetWorker from './workers/autotag_subnet_worker';
import AutotagInternetGatewayWorker from './workers/autotag_internet_gateway_worker';
import AutotagRDSWorker from './workers/autotag_rds_worker';
import AutotagEMRWorker from './workers/autotag_emr_worker';
import AutotagDataPipelineWorker from './workers/autotag_data_pipeline_worker';
import AutotagSecurityGroupWorker from './workers/autotag_security_group_worker';
import AutotagAMIWorker from './workers/autotag_ami_worker';
import AutotagSnapshotWorker from './workers/autotag_snapshot_worker';
import AutotagEIPWorker from './workers/autotag_eip_worker';
import AutotagDynamoDBWorker from './workers/autotag_dynamodb_worker';
import AutotagENIWorker from './workers/autotag_eni_worker';
import AutotagNATGatewayWorker from './workers/autotag_nat_gateway_worker';
import AutotagNetworkACLWorker from './workers/autotag_network_acl_worker';
import AutotagRouteTableWorker from './workers/autotag_route_table_worker';
import AutotagVPCPeeringWorker from './workers/autotag_vpc_peering_worker';
import AutotagVPNConnectionWorker from './workers/autotag_vpn_connection_worker';
import AutotagVPNGatewayWorker from './workers/autotag_vpn_gateway_worker';
import AutotagOpsworksWorker from './workers/autotag_opsworks_worker';
import AutotagIAMUserWorker from './workers/autotag_iam_user_worker';
import AutotagIAMRoleWorker from './workers/autotag_iam_role_worker';
import AutotagCustomerGatewayWorker from './workers/autotag_customer_gateway_worker';
import AutotagDhcpOptionsWorker from './workers/autotag_dhcp_options_worker';
import AutotagLambdaFunctionWorker from './workers/autotag_lambda_function_worker';
import AutotagCloudwatchAlarmWorker from './workers/autotag_cw_alarm_worker';
import AutotagCloudwatchEventsRuleWorker from './workers/autotag_cw_events_rule_worker';
import AutotagCloudwatchLogGroupWorker from './workers/autotag_cw_loggroup_worker';
import CONFIG from './cloud_trail_event_config';

const AutotagFactory = {
  createWorker: (event, enabledServices, s3Region) => {
    // Match Service
    const matchingService = find(values(CONFIG), { targetEventName: event.eventName });

    // Check service found and service enabled
    if (typeof matchingService === 'undefined'
      || enabledServices.indexOf(matchingService.name) < 0) {
      // Default: worker that does nothing
      return new AutotagDefaultWorker(event, s3Region);
    }

    // Select the relevant worker
    switch (matchingService.name) {
      case CONFIG.EC2.name:
        return new AutotagEC2Worker(event, s3Region);

      case CONFIG.S3.name:
        return new AutotagS3Worker(event, s3Region);

      case CONFIG.ELB.name:
        return new AutotagELBWorker(event, s3Region);

      case CONFIG.AUTOSCALE_GROUPS.name:
        return new AutotagAutoscaleWorker(event, s3Region);

      case CONFIG.VPC.name:
        return new AutotagVPCWorker(event, s3Region);

      case CONFIG.SUBNETS.name:
        return new AutotagSubnetWorker(event, s3Region);

      case CONFIG.EBS.name:
        return new AutotagEBSWorker(event, s3Region);

      case CONFIG.INTERNET_GATEWAY.name:
        return new AutotagInternetGatewayWorker(event, s3Region);

      case CONFIG.RDS.name:
        return new AutotagRDSWorker(event, s3Region);

      case CONFIG.EMR.name:
        return new AutotagEMRWorker(event, s3Region);

      case CONFIG.DATA_PIPELINE.name:
        return new AutotagDataPipelineWorker(event, s3Region);

      case CONFIG.SECURITY_GROUP.name:
        return new AutotagSecurityGroupWorker(event, s3Region);

      case CONFIG.AMI_CREATE.name:
        return new AutotagAMIWorker(event, s3Region);

      case CONFIG.AMI_COPY.name:
        return new AutotagAMIWorker(event, s3Region);

      case CONFIG.AMI_REGISTER.name:
        return new AutotagAMIWorker(event, s3Region);

      case CONFIG.SNAPSHOT_CREATE.name:
        return new AutotagSnapshotWorker(event, s3Region);

      case CONFIG.SNAPSHOT_COPY.name:
        return new AutotagSnapshotWorker(event, s3Region);

      case CONFIG.SNAPSHOT_IMPORT.name:
        return new AutotagSnapshotWorker(event, s3Region);

      case CONFIG.ELASTIC_IP.name:
        return new AutotagEIPWorker(event, s3Region);

      case CONFIG.DYNAMO_DB.name:
        return new AutotagDynamoDBWorker(event, s3Region);

      case CONFIG.ENI.name:
        return new AutotagENIWorker(event, s3Region);

      case CONFIG.NAT_GATEWAY.name:
        return new AutotagNATGatewayWorker(event, s3Region);

      case CONFIG.NETWORK_ACL.name:
        return new AutotagNetworkACLWorker(event, s3Region);

      case CONFIG.ROUTE_TABLE.name:
        return new AutotagRouteTableWorker(event, s3Region);

      case CONFIG.VPC_PEERING.name:
        return new AutotagVPCPeeringWorker(event, s3Region);

      case CONFIG.VPN_CONNECTION.name:
        return new AutotagVPNConnectionWorker(event, s3Region);

      case CONFIG.VPN_GATEWAY.name:
        return new AutotagVPNGatewayWorker(event, s3Region);

      case CONFIG.OPS_WORKS.name:
        return new AutotagOpsworksWorker(event, s3Region);

      case CONFIG.OPS_WORKS_CLONE.name:
        return new AutotagOpsworksWorker(event, s3Region);

      case CONFIG.IAM_USER.name:
        return new AutotagIAMUserWorker(event, s3Region);

      case CONFIG.IAM_ROLE.name:
        return new AutotagIAMRoleWorker(event, s3Region);

      case CONFIG.CUSTOMER_GATEWAY.name:
        return new AutotagCustomerGatewayWorker(event, s3Region);

      case CONFIG.DHCP_OPTIONS.name:
        return new AutotagDhcpOptionsWorker(event, s3Region);

      case CONFIG.LAMBDA_FUNCTION_2015.name:
        return new AutotagLambdaFunctionWorker(event, s3Region);

      case CONFIG.LAMBDA_FUNCTION_2014.name:
        return new AutotagLambdaFunctionWorker(event, s3Region);

      case CONFIG.CLOUDWATCH_ALARM.name:
        return new AutotagCloudwatchAlarmWorker(event, s3Region);

      case CONFIG.CLOUDWATCH_EVENTS_RULE.name:
        return new AutotagCloudwatchEventsRuleWorker(event, s3Region);

      case CONFIG.CLOUDWATCH_LOG_GROUP.name:
        return new AutotagCloudwatchLogGroupWorker(event, s3Region);

      // Default: worker that does nothing
      default:
        return new AutotagDefaultWorker(event, s3Region);
    }
  }
};

export default AutotagFactory;
