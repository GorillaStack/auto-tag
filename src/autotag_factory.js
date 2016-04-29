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
import CONFIG from './cloud_trail_event_config';

let AutotagFactory = {

  createWorker: (event, enabledServices) => {
    // Match Service
    let matchingService = _.findWhere(CONFIG, { targetEventName: event.eventName });

    // Check service found and service enabled
    if (_.isUndefined(matchingService)
      || !_.contains(enabledServices, matchingService.name)) {
      // Default: worker that does nothing
      return new AutotagDefaultWorker(event);
    }

    // Select the relevant worker
    switch (matchingService.name) {
      case CONFIG.EC2.name:
        return new AutotagEC2Worker(event);
        break;

      case CONFIG.S3.name:
        return new AutotagS3Worker(event);
        break;

      case CONFIG.ELB.name:
        return new AutotagELBWorker(event);
        break;

      case CONFIG.AUTOSCALE_GROUPS.name:
        return new AutotagAutoscaleWorker(event);
        break;

      case CONFIG.VPC.name:
        return new AutotagVPCWorker(event);
        break;

      case CONFIG.SUBNETS.name:
        return new AutotagSubnetWorker(event);
        break;

      case CONFIG.EBS.name:
        return new AutotagEBSWorker(event);
        break;

      case CONFIG.INTERNET_GATEWAY.name:
        return new AutotagInternetGatewayWorker(event);
        break;

      case CONFIG.RDS.name:
        return new AutotagRDSWorker(event);
        break;

      case CONFIG.EMR.name:
        return new AutotagEMRWorker(event);
        break;

      case CONFIG.DATA_PIPELINE.name:
        return new AutotagDataPipelineWorker(event);
        break;

      default:
        // Default: worker that does nothing
        return new AutotagDefaultWorker(event);

    }
  }
};

export default AutotagFactory;
