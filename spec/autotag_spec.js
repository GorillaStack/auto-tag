import requireMock from 'mock-require';
import cloudTrailEventConfig from '../lib/cloud_trail_event_config';
import _ from 'underscore';

let sut = null;
let constructorFlag = false;
let executeFlag = false;
let AwsCloudTrailListenerMock = class {
  constructor() {
    constructorFlag = true;
  }

  execute() {
    executeFlag = true;
  }
};

_.each(cloudTrailEventConfig, function(value, key) {
  AwsCloudTrailListenerMock[key] = value;
});

describe('AutoTag index file', () => {
  beforeAll(() => {
    requireMock('../lib/aws_cloud_trail_log_listener', AwsCloudTrailListenerMock);
    sut = require('../lib/autotag_log.js');
  });

  afterAll(() => {
    requireMock.stopAll();
  });

  const applicationContext = {
    succeed: () => {},

    fail: () => {}
  };

  it('should define a function called "handler"', () => {
    expect(sut).not.toBeUndefined();
    expect(sut.handler).not.toBeUndefined();
  });

  describe('autotag.handler', () => {
    beforeAll(() => {
      sut.handler();
    });

    it('creates an "AwsCloudTrailListener" object', function() {
      expect(constructorFlag).toBeTruthy();
    });

    it('invokes a method "execute"', function() {
      expect(executeFlag).toBeTruthy();
    });
  });
});
