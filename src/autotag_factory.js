import _ from 'underscore';
import AutotagDefaultWorker from './workers/autotag_default_worker.js';
import AutotagEC2Worker from './workers/autotag_ec2_worker.js';
import AutotagS3Worker from './workers/autotag_s3_worker.js';
import AutotagELBWorker from './workers/autotag_elb_worker.js';
import AutotagEBSWorker from './workers/autotag_ebs_worker.js';
import AutotagAutoscaleWorker from './workers/autotag_autoscale_worker.js';
import AutotagVPCWorker from './workers/autotag_vpc_worker.js';
import AutotagSubnetWorker from './workers/autotag_subnet_worker.js';
import AutotagInternetGatewayWorker from './workers/autotag_internet_gateway_worker.js';
import AutotagRDSWorker from './workers/autotag_rds_worker.js';
import AutotagEMRWorker from './workers/autotag_emr_worker.js';
import AutotagDataPipelineWorker from './workers/autotag_data_pipeline_worker.js';
import AutotagSecurityGroupWorker from './workers/autotag_security_group_worker.js';
import AutotagAMIWorker from './workers/autotag_ami_worker.js';
import AutotagSnapshotWorker from './workers/autotag_snapshot_worker.js';
import AutotagEIPWorker from './workers/autotag_eip_worker.js';
import AutotagDynamoDBWorker from './workers/autotag_dynamodb_worker.js';
import AutotagENIWorker from './workers/autotag_eni_worker.js';
import AutotagNATGatewayWorker from './workers/autotag_nat_gateway_worker.js';
import AutotagNetworkACLWorker from './workers/autotag_network_acl_worker.js';
import AutotagRouteTableWorker from './workers/autotag_route_table_worker.js';
import AutotagVPCPeeringWorker from './workers/autotag_vpc_peering_worker.js';
import AutotagVPNWorker from './workers/autotag_vpn_worker.js';
import AutotagOpsworksWorker from './workers/autotag_opsworks_worker.js';
import CONFIG from './cloud_trail_event_config';
import SETTINGS from './cloud_trail_event_settings';

let AutotagFactory = {

  createWorker: (event, enabledServices, s3Region) => {

    // Match Service
    let matchingService = _.findWhere(CONFIG, { targetEventName: event.eventName });

    // Check service found and service enabled
    if (_.isUndefined(matchingService)
      || !_.contains(enabledServices, matchingService.name)) {
      // Default: worker that does nothing
      return new AutotagDefaultWorker(event, s3Region);
    }

    if (SETTINGS.DebugLogging) {this.logDebug()};

    // Select the relevant worker
    switch (matchingService.name) {
      case CONFIG.EC2.name:
        return new AutotagEC2Worker(event, s3Region);
        break;

      case CONFIG.S3.name:
        return new AutotagS3Worker(event, s3Region);
        break;

      case CONFIG.ELB.name:
        return new AutotagELBWorker(event, s3Region);
        break;

      case CONFIG.AUTOSCALE_GROUPS.name:
        return new AutotagAutoscaleWorker(event, s3Region);
        break;

      case CONFIG.VPC.name:
        return new AutotagVPCWorker(event, s3Region);
        break;

      case CONFIG.SUBNETS.name:
        return new AutotagSubnetWorker(event, s3Region);
        break;

      case CONFIG.EBS.name:
        return new AutotagEBSWorker(event, s3Region);
        break;

      case CONFIG.INTERNET_GATEWAY.name:
        return new AutotagInternetGatewayWorker(event, s3Region);
        break;

      case CONFIG.RDS.name:
        return new AutotagRDSWorker(event, s3Region);
        break;

      case CONFIG.EMR.name:
        return new AutotagEMRWorker(event, s3Region);
        break;

      case CONFIG.DATA_PIPELINE.name:
        return new AutotagDataPipelineWorker(event, s3Region);
        break;

      case CONFIG.SECURITY_GROUP.name:
        return new AutotagSecurityGroupWorker(event, s3Region);
        break;

      case CONFIG.AMI.name:
        return new AutotagAMIWorker(event, s3Region);
        break;

      case CONFIG.SNAPSHOT.name:
        return new AutotagSnapshotWorker(event, s3Region);
        break;

      case CONFIG.ELASTIC_IP.name:
        return new AutotagEIPWorker(event, s3Region);
        break;

      case CONFIG.DYNAMO_DB.name:
        return new AutotagDynamoDBWorker(event, s3Region);
        break;

      case CONFIG.ENI.name:
        return new AutotagENIWorker(event, s3Region);
        break;

      case CONFIG.NAT_GATEWAY.name:
        return new AutotagNATGatewayWorker(event, s3Region);
        break;

      case CONFIG.NETWORK_ACL.name:
        return new AutotagNetworkACLWorker(event, s3Region);
        break;

      case CONFIG.ROUTE_TABLE.name:
        return new AutotagRouteTableWorker(event, s3Region);
        break;

      case CONFIG.VPC_PEERING.name:
        return new AutotagVPCPeeringWorker(event, s3Region);
        break;

      case CONFIG.VPN.name:
        return new AutotagVPNWorker(event, s3Region);
        break;

      case CONFIG.OPS_WORKS.name:
        return new AutotagOpsworksWorker(event, s3Region);
        break;

      case CONFIG.OPS_WORKS_CLONE.name:
        return new AutotagOpsworksWorker(event, s3Region);
        break;

      // Default: worker that does nothing
      default:
        return new AutotagDefaultWorker(event, s3Region);

    }
  }
};

export default AutotagFactory;
