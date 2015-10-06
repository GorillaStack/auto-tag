const _ = require('underscore');
const AutotagDefaultWorker = require('./workers/autotag_default_worker.js');
const AutotagEC2Worker = require('./workers/autotag_ec2_worker.js');
const AutotagS3Worker = require('./workers/autotag_s3_worker.js');
const AutotagELBWorker = require('./workers/autotag_elb_worker.js');
const AutotagEBSWorker = require('./workers/autotag_ebs_worker.js');
const AutotagAutoscaleWorker = require('./workers/autotag_autoscale_worker.js');
const AutotagVPCWorker = require('./workers/autotag_vpc_worker.js');
const AutotagSubnetWorker = require('./workers/autotag_subnet_worker.js');
const AutotagInternetGatewayWorker = require('./workers/autotag_internet_gateway_worker.js');
const AutotagRDSWorker = require('./workers/autotag_rds_worker.js');
const AutotagEMRWorker = require('./workers/autotag_emr_worker.js');
const AutotagDataPipelineWorker = require('./workers/autotag_data_pipeline_worker.js');
const CONFIG = require('./cloud_trail_event_config');

let AutotagFactory = {

  createWorker: function(event, enabledServices) {
    // Match Service
    let matchingService = _.findWhere(CONFIG, {targetEventName: event.eventName});

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
